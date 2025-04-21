<?php

namespace App\Actions\Product;

use App\Models\Catalog\Product;
use App\Modules\Integrations\Contracts\CanCreateProducts;
use Illuminate\Support\Str;

class CreateProductAction
{
    public function execute(array $data): Product
    {
        /** @var Product $product */
        $product = Product::create($data);

        $integrationClient = $product->integrationClient();

        if($integrationClient instanceof CanCreateProducts) {
            /**
             * @todo implement DTO (data transfer object) or other design patterns
             * to avoid exposing integration specific model to our domain
             * */
            $integrationProduct = $integrationClient->createProduct($product);

            $product->gateway_product_id = $integrationProduct->id;
            $product->gateway_provider = $product->integration->type;
            $product->save();
        }

        return $product;
    }
}
