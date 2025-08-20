<?php

declare(strict_types=1);

namespace App\Actions\Price;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Organization;
use Illuminate\Http\Request;

class StorePrice
{
    public function __invoke(Product $product, Request $request): ?Price
    {
        // Validation ensures product belongs to the current organization
        $validated = $request->validated();
        $organization = app(Organization::class);

        // gateway_prices path is only used by product import flows, not price creation
        $gatewayPrices = $request->input('gateway_prices', []);
        $integrationClient = $product->integrationClient();
        if($product->integration_id && $integrationClient && !empty($gatewayPrices)) {
            return $integrationClient->importPrice($product, $gatewayPrices);
        } else {
            $validated['organization_id'] = $organization->id;

            // Retain gateway linkage even for custom/variant (moving/variants may still be gateway-linked)

            $price = $product->prices()->create($validated);

            return $price;
        }
    }
}
