<?php

namespace App\Actions\Price;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;

class CreatePriceAction
{
    public function execute(Product $product, array $data): Price
    {
        return $product->prices()->create([
            'scope' => $data['scope'],
            'parent_list_price_id' => $data['parent_list_price_id'] ?? null,
            'pricing_model' => $data['pricing_model'],
            'amount' => $data['amount'],
            'currency' => $data['currency'],
            'recurring_interval' => $data['recurring_interval'] ?? null,
            'recurring_interval_count' => $data['recurring_interval_count'] ?? null,
            'cancel_after_cycles' => $data['cancel_after_cycles'] ?? null,
            'properties' => $data['properties'] ?? null,
            'gateway_provider' => $data['gateway_provider'] ?? null,
            'gateway_price_id' => $data['gateway_price_id'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }
}
