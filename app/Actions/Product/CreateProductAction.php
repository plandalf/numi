<?php

namespace App\Actions\Product;

use App\Models\Catalog\Product;
use Illuminate\Support\Str;

class CreateProductAction
{
    public function execute(array $data): Product
    {
        return Product::create([
            'name' => $data['name'],
            'lookup_key' => $data['lookup_key'] ?? Str::slug($data['name']),
            'gateway_provider' => $data['gateway_provider'] ?? null,
            'gateway_product_id' => $data['gateway_product_id'] ?? null,
        ]);
    }
}
