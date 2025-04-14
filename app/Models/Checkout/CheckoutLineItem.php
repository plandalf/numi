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

    public function session()
    {
        return $this->belongsTo(CheckoutSession::class);
    }

    public function slot()
    {
        return $this->belongsTo(Slot::class, 'slot_id');
    }
}
