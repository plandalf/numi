<?php

declare(strict_types=1);

namespace App\Actions\Price;

use App\Http\Requests\Price\StoreRequest;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Organization;
use App\Modules\Integrations\Contracts\HasPrices;

class StorePrice
{
    public function __invoke(Product $product, StoreRequest $request): Price
    {
        // Validation ensures product belongs to the current organization
        $validated = $request->validated();
        $organization = app(Organization::class);

        $validated['organization_id'] = $organization->id;
        $validated['integration_id'] = $product->integration_id;

        $price = $product->prices()->create($validated);

        $integrationClient = $product->integrationClient();

        if ($integrationClient instanceof HasPrices) {
            /**
             * @todo implement DTO (data transfer object) or other design patterns
             * to avoid exposing integration specific model to our domain
             * */
            $integrationPrice = $integrationClient->createPrice($price, $product);

            $price->gateway_price_id = $integrationPrice->id;
            $price->gateway_provider = $product->integration->type;

            $price->save();
        }

        return $price;
    }
}
