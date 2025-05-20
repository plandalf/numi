<?php

namespace App\Models\Checkout;

use App\Database\Traits\UuidRouteKey;
use App\Enums\CheckoutSessionStatus;
use App\Models\Customer;
use App\Models\Order\Order;
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
        // 'customer_id',
    ];

    protected $casts = [
        'status' => CheckoutSessionStatus::class,
        'expires_at' => 'datetime',
        'finalized_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $attributes = [
        'status' => CheckoutSessionStatus::STARTED,
    ];

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

    public function getLineItemsBreakdownAttribute()
    {
        return $this->lineItems->pluck('line_item')->toArray();
    }

    public function getTotalAttribute()
    {
        return $this->lineItems->sum('line_item.total');
    }

    public function getSubtotalAttribute()
    {
        return $this->lineItems->sum('line_item.subtotal');
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
