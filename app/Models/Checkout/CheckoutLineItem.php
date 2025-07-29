<?php

namespace App\Models\Checkout;

use App\Models\Catalog\Price;
use App\Models\Store\OfferItem;
use App\Traits\ComputesPrice;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Price $price
 */
class CheckoutLineItem extends Model
{
    use HasFactory, ComputesPrice;

    protected $table = 'checkout_line_items';

    protected $fillable = [
        'checkout_session_id',
        'price_id',
        'offer_item_id',
        'quantity',
        'organization_id',
        'deleted_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function price(): BelongsTo
    {
        return $this->belongsTo(Price::class);
    }

    public function getCurrencyAttribute(): ?string
    {
        return $this->price->currency;
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(CheckoutSession::class);
    }

    public function offerItem(): BelongsTo
    {
        return $this->belongsTo(OfferItem::class, 'offer_item_id');
    }
}
