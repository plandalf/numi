<?php

declare(strict_types=1);

namespace App\Actions\Price;

use App\Http\Requests\Price\StoreRequest;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Organization;

class StorePrice
{
    public function __invoke(Product $product, StoreRequest $request): Price
    {
        // Validation ensures product belongs to the current organization
        $validated = $request->validated();
        $organization = app(Organization::class);

        $validated['organization_id'] = $organization->id;

        return $product->prices()->create($validated);
    }
}
