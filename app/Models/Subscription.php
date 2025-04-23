<?php

namespace App\Models;

use Illuminate\Support\Facades\Cache;
use Laravel\Cashier\Subscription as CashierSubscription;
use Stripe\Price;
use Stripe\Product;
use Stripe\Stripe;

class Subscription extends CashierSubscription
{
    public function getProductNameAttribute()
    {
        return Cache::remember("stripe_product_name_{$this->stripe_price}", now()->addDays(7), function () {
            Stripe::setApiKey(config('cashier.secret'));
    
            $price = Price::retrieve($this->stripe_price);
            $product = Product::retrieve($price->product);
            
            return $product->name;
        });
    }

    public function getTrialDaysLeftAttribute()
    {
        return $this->trial_ends_at ? ceil(now()->diffInDays($this->trial_ends_at)) : 0;
    }

    public function getIsFreePlanAttribute()
    {
        return $this->stripe_price === config('cashier.free_price_id');
    }
}