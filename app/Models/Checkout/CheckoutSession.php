<?php

namespace App\Models\Checkout;

use App\Enums\CheckoutSessionStatus;
use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CheckoutSession extends Model
{
    use HasFactory;

    protected $table = 'checkout_sessions';

    protected $fillable = [
        'offer_id',
        'status',
        'expires_at',
        'finalized_at',
        'metadata',
        'organization_id'
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
        return $this->hasMany(CheckoutLineItem::class);
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
}
