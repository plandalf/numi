<?php

namespace App\Models\Checkout;

use App\Models\Catalog\Price;
use App\Models\Store\Slot;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutLineItem extends Model
{
    use HasFactory;

    protected $table = 'checkout_line_items';

    protected $fillable = [
        'checkout_session_id',
        'price_id',
        'slot_id',
        'quantity',
        'organization_id',
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

    public function slot()
    {
        return $this->belongsTo(Slot::class, 'slot_id');
    }

    public function getLineItemAttribute()
    {
        return [
            'id' => $this->id,
            'slot' => $this->slot->name,
            'name' => $this->slot->name,
            'quantity' => $this->quantity,
            'subtotal' => $this->price->calculateAmount()->getAmount(),
            // 'taxes' => $this->price->calculateTaxes()->getAmount(),
            'total' => $this->price->calculateAmount()->getAmount(),
            // 'discount' => $this->price->calculateDiscount()->getAmount(),
        ];
    }
}
