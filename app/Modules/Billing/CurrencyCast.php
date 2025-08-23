<?php

namespace App\Modules\Billing;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class CurrencyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes)
    {
        return ! empty($value) ? new \Money\Currency($value) : null;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes)
    {
        $code = match (true) {
            is_null($value) => null,
            is_string($value) => $value,
            $value instanceof \Money\Currency => $value->getCode(),
            $value instanceof Currency => $value->getAlpha3(),
            default => (string) $value,
        };

        if ($code === null) {
            return null;
        }

        // Persist lowercase ISO code
        return strtolower($code);
    }
}
