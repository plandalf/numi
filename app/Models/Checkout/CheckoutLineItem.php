<?php

namespace App\Models\Checkout;

use App\Models\Catalog\Price;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutLineItem extends Model
{
    /** @use HasFactory<\Database\Factories\CheckoutFactory> */
    use HasFactory;

    protected $table = 'checkout_line_items';

    protected $fillable = [

    ];
// relates to a "price" basically

    public function price()
    {
        return $this->belongsTo(Price::class);
    }

    public function session()
    {
        return $this->belongsTo(CheckoutSession::class);
    }
}
