<?php

namespace App\Models;

use Illuminate\Support\Facades\Cache;
use Laravel\Cashier\Subscription as CashierSubscription;
use Stripe\Price;
use Stripe\Product;
use Stripe\Stripe;

class Subscription extends CashierSubscription
{
    protected $table = 'tenant_subscriptions';

    public function getProductNameAttribute()
    {
        return Cache::remember("stripe_product_name_{$this->stripe_price}", now()->addDays(7), function () {
            Stripe::setApiKey(config('cashier.secret'));

            $price = Price::retrieve($this->stripe_price);
            $product = Product::retrieve($price->product);

            return $product->name;
        });
    }
}
