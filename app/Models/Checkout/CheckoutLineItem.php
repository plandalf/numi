<?php

namespace App\Models\Checkout;

use App\Models\Catalog\Price;
use App\Models\Store\OfferItem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutLineItem extends Model
{
    use HasFactory;

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

    public function price()
    {
        return $this->belongsTo(Price::class);
    }

    public function getCurrencyAttribute()
    {
        return $this->price->currency;
    }

    public function session()
    {
        return $this->belongsTo(CheckoutSession::class);
    }

    public function offerItem()
    {
        return $this->belongsTo(OfferItem::class, 'offer_item_id');
    }

    public function getLineItemAttribute()
    {
        return [
            'id' => $this->id,
            'offer_item' => $this->offerItem->name,
            'name' => $this->offerItem->name,
            'quantity' => $this->quantity,
            'subtotal' => $this->price->calculateAmount()->getAmount(),
            // 'taxes' => $this->price->calculateTaxes()->getAmount(),
            'total' => $this->price->calculateAmount()->getAmount(),
            'image' => $this->price->product->image,
            // 'discount' => $this->price->calculateDiscount()->getAmount(),
        ];
    }
}
