<?php

namespace App\Models\Checkout;

use App\Database\Traits\UuidRouteKey;
use App\Enums\CheckoutSessionStatus;
use App\Enums\IntegrationType;
use App\Models\Customer;
use App\Models\Integration;
use App\Models\Order\Order;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\PaymentMethod;
use App\Modules\Integrations\AbstractIntegration;
use App\Modules\Integrations\Stripe\Stripe;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Arr;

/**
 * @property int $organization_id
 * @property int|null $payment_method_id
 *
 * // todo :itnegration_id
 *
 * @property array<string, string> $properties
 * @property Carbon $expires_at
 * @property Collection<CheckoutLineItem> $lineItems
 * @property Customer $customer
 * @property PaymentMethod|null $paymentMethod
 * @property \App\Enums\CheckoutSessionStatus $status
 * @property int|null $customer_id
 * @property \Illuminate\Support\Carbon|null $finalized_at
 * @property bool $test_mode
 * @property Organization $organization
 * @property array $discounts
 *
 * @property string $currency
 * @property string $publishable_key
 * @property array|null $metadata
 * @property string $intent_type
 *
 * @property string $client_secret
 * @property string $payment_confirmed_at
 * @property bool $payment_method_locked
 * @property string $return_url
 *
 * # dynamic
 * @property int $total
 * @property int $taxes
 * @property int $inclusive_taxes
 * @property int $subtotal
 * @property array $enabled_payment_methods
 * @property Order|null $order
 * @property Offer $offer
 *
 * @property int $payments_integration_id
 * @property Integration $paymentsIntegration
 *
 * @property Integration $integration DEPRECATED
 * @property mixed $intent_id
 * @property Stripe $integrationClient
 * @property int $id
 */
class CheckoutSession extends Model
{
    use HasFactory,
        UuidRouteKey;

    protected $table = 'checkout_sessions';

    protected $fillable = [
        'offer_id',
        'status',
        'expires_at',
        'finalized_at',
        'metadata',
        'payments_integration_id',
        'organization_id',
        'uuid',
        'deleted_at',
        'discounts',
        'properties',
        'test_mode',
        'customer_id',
        'payment_method_id',
        'return_url', // [stripe-intent]
        'payment_confirmed_at', // [stripe-intent]
        'payment_method_locked', // [stripe-intent]
        'intent_id', 'intent_type', 'client_secret'
    ];

    protected $casts = [
        'status' => CheckoutSessionStatus::class,
        'expires_at' => 'datetime',
        'finalized_at' => 'datetime',
        'metadata' => 'array',
        'discounts' => 'array',
        'properties' => 'array',
        'test_mode' => 'boolean',
        'payment_confirmed_at' => 'datetime',
        'payment_method_locked' => 'boolean',
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

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function paymentsIntegration(): BelongsTo
    {
        return $this->belongsTo(Integration::class, 'payments_integration_id');
    }

    public function getIntegrationAttribute()
    {
        if (!is_null($this->payments_integration_id)) {
            return $this->paymentsIntegration;
        }

        return $this->organization
            ->integrations()
            ->where('type', $this->test_mode
                ? IntegrationType::STRIPE_TEST
                : IntegrationType::STRIPE)
            ->first();
    }

    public function order(): HasOne
    {
        return $this->hasOne(Order::class);
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

        // JIT: Just return the basic enabled methods without Stripe API calls
        // Let the frontend handle filtering based on currency, amount, and intent mode
        $enabledMethods = $this->integration->getEnabledPaymentMethods();

        // Return basic enabled methods - frontend will filter based on context
        return $enabledMethods;
    }

    public function getIntentModeAttribute(): string
    {
        // Load line items with their prices if not already loaded
        if (!$this->relationLoaded('lineItems')) {
            $this->load('lineItems.price');
        }

        // Check if any line item has a recurring price (subscription)
        $hasSubscriptionItems = $this->lineItems->some(function (CheckoutLineItem $lineItem) {
            $price = $lineItem->price;
            return $price && $price->type->isSubscription() && !empty($price->renew_interval);
        });

        return $hasSubscriptionItems ? 'setup' : 'payment';
    }

    public function getHasSubscriptionItemsAttribute(): bool
    {
        // Load line items with their prices if not already loaded
        if (!$this->relationLoaded('lineItems')) {
            $this->load('lineItems.price');
        }

        return $this->lineItems->some(function (CheckoutLineItem $lineItem) {
            $price = $lineItem->price;
            return $price && $price->type->isSubscription() && !empty($price->renew_interval);
        });
    }

    public function getHasOnetimeItemsAttribute(): bool
    {
        // Load line items with their prices if not already loaded
        if (!$this->relationLoaded('lineItems')) {
            $this->load('lineItems.price');
        }

        return $this->lineItems->some(function (CheckoutLineItem $lineItem) {
            $price = $lineItem->price;
            return $price && $price->type->isOneTime();
        });
    }

    public function getHasMixedCartAttribute(): bool
    {
        return $this->has_subscription_items && $this->has_onetime_items;
    }

    public function hasACompletedOrder(): bool
    {
        if ($this->status === \App\Enums\CheckoutSessionStatus::CLOSED) {
            return !is_null($this->order);
        }

        return false;
    }

    public function integrationClient(): ?AbstractIntegration
    {

        if (!is_null($this->payments_integration_id)) {
            return $this->paymentsIntegration->integrationClient();
        }

        if (! $this->lineItems->first()) {
            return null;
        }

        return $this->integration->integrationClient();
    }

    /**
     * Check the current intent state and determine if user should be blocked
     * This is called when loading checkout to handle refresh/return scenarios
     */
    public function getIntentState(): array
    {
        // If no intent exists, user can proceed normally
        if (!$this->intent_id || !$this->client_secret) {
            return [
                'can_proceed' => true,
                'blocked' => false,
                'reason' => null,
                'intent_status' => null,
                'requires_action' => false,
                'payment_confirmed' => false,
            ];
        }

        try {
            $integrationClient = $this->integrationClient();
            if (!$integrationClient) {
                return [
                    'can_proceed' => false,
                    'blocked' => true,
                    'reason' => 'Integration client not available',
                    'intent_status' => null,
                    'requires_action' => false,
                    'payment_confirmed' => false,
                ];
            }

            // Retrieve the intent from Stripe to check its current state
            $intent = $integrationClient->retrieveIntent($this->intent_id, $this->intent_type);

            if (!$intent) {
                return [
                    'can_proceed' => false,
                    'blocked' => true,
                    'reason' => 'Intent not found or invalid',
                    'intent_status' => null,
                    'requires_action' => false,
                    'payment_confirmed' => false,
                ];
            }

            $intentStatus = $intent->status;
            $requiresAction = in_array($intentStatus, ['requires_action', 'requires_confirmation', 'requires_payment_method']);
            $paymentConfirmed = in_array($intentStatus, ['succeeded', 'processing']);

            // Update our local state based on Stripe's state
            $this->update([
                'payment_confirmed_at' => $paymentConfirmed ? now() : null,
                'metadata' => array_merge($this->metadata ?? [], [
                    'last_intent_status_check' => now()->toISOString(),
                    'intent_status' => $intentStatus,
                    'requires_action' => $requiresAction,
                ])
            ]);

            // Determine if user should be blocked
            $blocked = false;
            $reason = null;

            // Only block if payment is in a terminal state or already confirmed
            if ($intentStatus === 'canceled') {
                $blocked = true;
                $reason = 'Payment was canceled';
            } elseif ($intentStatus === 'succeeded' && !$this->payment_confirmed_at) {
                // Payment succeeded but not confirmed locally - this is unusual
                $blocked = true;
                $reason = 'Payment already succeeded but not confirmed';
            } elseif ($intentStatus === 'processing' && !$this->payment_confirmed_at) {
                // Payment is processing but not confirmed locally
                $blocked = true;
                $reason = 'Payment is processing';
            } elseif ($this->payment_confirmed_at) {
                // Payment was already confirmed locally - allow to proceed
                $blocked = false;
                $reason = null;
            }
            // For all other states (requires_payment_method, requires_action, etc.), allow the user to proceed
            // These are normal states for a payment that hasn't been completed yet

            return [
                'can_proceed' => !$blocked,
                'blocked' => $blocked,
                'reason' => $reason,
                'intent_status' => $intentStatus,
                'requires_action' => $requiresAction,
                'payment_confirmed' => $paymentConfirmed,
                'intent_id' => $this->intent_id,
                'intent_type' => $this->intent_type,
            ];

        } catch (\Exception $e) {
            \Log::error('Failed to check intent state', [
                'checkout_session_id' => $this->id,
                'intent_id' => $this->intent_id,
                'error' => $e->getMessage(),
            ]);

            return [
                'can_proceed' => false,
                'blocked' => true,
                'reason' => 'Failed to check payment status',
                'intent_status' => null,
                'requires_action' => false,
                'payment_confirmed' => false,
            ];
        }
    }

    /**
     * Check if this checkout session has an active intent that needs attention
     */
    public function hasActiveIntent(): bool
    {
        return !empty($this->intent_id) && !empty($this->client_secret);
    }
}
