<?php

declare(strict_types=1);

namespace App\Actions\Price;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Organization;
use Illuminate\Http\Request;

class StorePrice
{
    public function __invoke(Product $product, Request $request)
    {
        // Validation ensures product belongs to the current organization
        $validated = $request->validated();
        $organization = app(Organization::class);

        $gatewayPrices = $request->input('gateway_prices', []);
        $integrationClient = $product->integrationClient();
        if($product->integration_id && $integrationClient && !empty($gatewayPrices)) {
            $integrationClient->importPrice($product, $gatewayPrices);
        } else {
            $validated['organization_id'] = $organization->id;

            $price = $product->prices()->create($validated);
        }

        /**
         * Not used for now, but could be used in the future
         * once we deiced to create prices in the integration
         */
        // if ($integrationClient instanceof HasPrices) {
        //     /**
        //      * @todo implement DTO (data transfer object) or other design patterns
        //      * to avoid exposing integration specific model to our domain
        //      * */
        //     $integrationPrice = $integrationClient->createPrice($price, $product);

        //     $price->gateway_price_id = $integrationPrice->id;
        //     $price->gateway_provider = $product->integration->type;

        //     $price->save();
        // }
    }
}
