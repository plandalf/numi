<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use App\ValueObjects\BillingDetails;

class BillingDetailsCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        return new BillingDetails(json_decode($value, true) ?? []);
    }

    public function set($model, string $key, $value, array $attributes)
    {
        return json_encode($value instanceof BillingDetails ? $value->toArray() : $value);
    }
} 