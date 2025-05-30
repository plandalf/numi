<?php

namespace App\Models\Checkout;

use App\Database\Traits\UuidRouteKey;
use App\Enums\CheckoutSessionStatus;
use App\Models\Customer;
use App\Models\Order\Order;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Modules\Integrations\AbstractIntegration;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Arr;

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
        // 'customer_id',
    ];

    protected $casts = [
        'status' => CheckoutSessionStatus::class,
        'expires_at' => 'datetime',
        'finalized_at' => 'datetime',
        'metadata' => 'array',
        'discounts' => 'array',
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

        if (empty($this->discounts)) {
            return $subtotal;
        }

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

    public function getSubtotalAttribute()
    {
        return $this->lineItems->sum('subtotal');
    }

    public function getCurrencyAttribute()
    {
        return $this->lineItems->first()?->currency ?? 'usd';
    }

    public function getPublishableKeyAttribute()
    {
        if (! $this->lineItems->first()) {
            return null;
        }

        return Arr::get($this->integration?->config, 'access_token.stripe_publishable_key');
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

    public function integration(): BelongsTo
    {
        return $this->lineItems->first()->price->integration();
    }

    public function order(): HasOne
    {
        return $this->hasOne(Order::class);
    }
}
