<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Http\Requests\Product\ProductUpdateRequest;
use App\Models\Catalog\Product;

class UpdateProduct
{
    public function __invoke(Product $product, ProductUpdateRequest $request): Product
    {
        $product->update($request->validated());
        return $product->fresh();
    }
}
