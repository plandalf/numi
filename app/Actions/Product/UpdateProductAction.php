<?php

namespace App\Actions\Product;

use App\Models\Catalog\Product;
use Illuminate\Support\Str;

class UpdateProductAction
{
    public function execute(Product $product, array $data): Product
    {
        $product->update([
            'name' => $data['name'],
            'lookup_key' => $data['lookup_key'] ?? Str::slug($data['name']),
            'gateway_provider' => $data['gateway_provider'] ?? null,
            'gateway_product_id' => $data['gateway_product_id'] ?? null,
        ]);

        return $product;
    }
}
