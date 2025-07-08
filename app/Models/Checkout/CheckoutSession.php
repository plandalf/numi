<?php

namespace App\Models\Checkout;

use App\Database\Traits\UuidRouteKey;
use App\Enums\CheckoutSessionStatus;
use App\Enums\IntegrationType;
use App\Models\Customer;
use App\Models\Order\Order;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Modules\Integrations\AbstractIntegration;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Arr;

/**
 * @property array<string, string> $properties
 * @property Carbon $expires_at
 * @property Collection<CheckoutLineItem> $line_items
 * @property Customer $customer
 */
class CheckoutSession extends Model
{
    use HasFactory, UuidRouteKey;

    protected $table = 'checkout_sessions';

    protected $fillable = [
        'offer_id',
        'status',
        'expires_at',
        'finalized_at',
        'metadata',
        'organization_id',
        'uuid',
        'deleted_at',
        'discounts',
        'properties',
        'test_mode',
        // 'customer_id',
    ];

    protected $casts = [
        'status' => CheckoutSessionStatus::class,
        'expires_at' => 'datetime',
        'finalized_at' => 'datetime',
        'metadata' => 'array',
        'discounts' => 'array',
        'properties' => 'array',
        'test_mode' => 'boolean',
    ];

    protected $attributes = [
        'status' => CheckoutSessionStatus::STARTED,
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class, 'offer_id');
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(CheckoutLineItem::class, 'checkout_session_id');
    }

    public function markAsClosed(bool $save = false): self
    {
        $this->status = CheckoutSessionStatus::CLOSED;
        $this->finalized_at = now();

        if ($save) {
            $this->save();
        }

        return $this;
    }

    public function markAsFailed(bool $save = false): self
    {
        $this->status = CheckoutSessionStatus::FAILED;

        if ($save) {
            $this->save();
        }

        return $this;
    }

    public function getTotalAttribute()
    {
        $subtotal = $this->lineItems->sum('total');

        if (!empty($this->discounts)) {
            $discountAmount = 0;
            foreach ($this->discounts as $discount) {
                if (isset($discount['percent_off'])) {
                    $discountAmount += ($subtotal * ($discount['percent_off'] / 100));
                } elseif (isset($discount['amount_off'])) {
                    $discountAmount += $discount['amount_off'];
                }
            }

            return max(0, $subtotal - $discountAmount);
        }

        return $subtotal;
    }

    public function getTaxesAttribute()
    {
        return $this->lineItems->sum('taxes');
    }

    // public function getExclusiveTaxesAttribute()
    // {
    //     return $this->lineItems->sum('exclusive_taxes');
    // }

    public function getInclusiveTaxesAttribute()
    {
        return $this->lineItems->sum('inclusive_taxes');
    }

    public function getSubtotalAttribute()
    {
        return $this->lineItems->sum('total');
    }

    public function getCurrencyAttribute()
    {
        return $this->lineItems->first()?->currency ?? 'usd';
    }

    public function getPublishableKeyAttribute()
    {
        // Always return the publishable key if we have an integration
        // Don't require line items for getting the publishable key
        return Arr::get($this->integration?->config, 'access_token.stripe_publishable_key');
    }

    public function getEnabledPaymentMethodsAttribute()
    {
        if (!$this->integration) {
            return [];
        }

        // Get all enabled payment methods from integration
        $enabledMethods = $this->integration->getEnabledPaymentMethods();
        
        // Get all available methods for this currency to check which ones are valid
        $currency = strtolower($this->currency ?? 'usd');
        $availableForCurrency = array_merge(
            array_keys($this->integration->getAvailablePaymentMethods($currency)),
            array_keys($this->integration->getPaymentOnlyMethods($currency))
        );

        // Filter enabled methods to only include those available for this currency
        return array_values(array_intersect($enabledMethods, $availableForCurrency));
    }

    public function getIntentModeAttribute()
    {
        // Load line items with their prices if not already loaded
        if (!$this->relationLoaded('lineItems')) {
            $this->load('lineItems.price');
        }

        // Check if any line item has a recurring price (subscription)
        $hasSubscriptionItems = $this->lineItems->some(function (CheckoutLineItem $lineItem) {
            $price = $lineItem->price;
            return $price && 
                   in_array($price->type?->value, ['graduated', 'volume', 'package', 'recurring']) &&
                   !empty($price->renew_interval);
        });

        // If has subscription items, use setup mode to save payment method
        // Otherwise, use payment mode for direct one-time payments
        return $hasSubscriptionItems ? 'setup' : 'payment';
    }

    public function integrationClient(): ?AbstractIntegration
    {
        if (! $this->lineItems->first()) {
            return null;
        }

        return $this->integration->integrationClient();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function getIntegrationAttribute()
    {
        /**
         * Right now, we have two integrations, Stripe and Plandalf.
         * Plandalf has no payment integration yet, so by default, we use Stripe.
         * If test_mode is true, we use STRIPE_TEST, otherwise STRIPE.
         */
        $integrationType = $this->test_mode ? IntegrationType::STRIPE_TEST : IntegrationType::STRIPE;
        
        return $this->organization->integrations()
            ->where('type', $integrationType)
            ->first();
    }

    public function integration()
    {
        // Keep the old method for backward compatibility with eager loading
        // but it will use the live integration by default
        return $this->hasOneThrough(
            \App\Models\Integration::class,
            Organization::class,
            'id', // Foreign key on organizations table
            'organization_id', // Foreign key on integrations table
            'organization_id', // Local key on checkout_sessions table
            'id' // Local key on organizations table
        )->where('type', IntegrationType::STRIPE);
    }

    public function order(): HasOne
    {
        return $this->hasOne(Order::class);
    }
}
