<?php

declare(strict_types=1);

namespace App\Actions\Price;

use App\Http\Requests\Price\UpdateRequest;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;

class UpdatePrice
{
    public function __invoke(Product $product, Price $price, UpdateRequest $request): Price
    {
        // Validation ensures product and price belong to the current organization
        $validated = $request->validated();

        // TODO: Add logic for gateway provider price update if needed

        $price->update($validated);
        return $price->fresh();
    }
}
