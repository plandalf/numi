<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Http\Requests\Product\ProductStoreRequest;
use App\Models\Catalog\Product;
use Illuminate\Support\Facades\Auth;

class CreateProduct
{
    public function __invoke(ProductStoreRequest $request): Product
    {
        $validated = $request->validated();
        // Ensure the product is associated with the current organization
        $validated['organization_id'] = Auth::user()->currentOrganization->id;

        return Product::create($validated);
    }
}
