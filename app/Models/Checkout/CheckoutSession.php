<?php

namespace App\Models\Checkout;

use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Model;

class CheckoutSession extends Model
{
    protected $table = 'checkout_sessions';



    public function offer(): Offer
    {
        return $this->belongsTo(Offer::class);
    }
}
