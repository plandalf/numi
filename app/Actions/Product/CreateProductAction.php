<?php

namespace App\Actions\Product;

use App\Enums\ProductStatus;
use App\Models\Catalog\Product;
use App\Modules\Integrations\Contracts\HasProducts;
use Illuminate\Support\Str;

class CreateProductAction
{
    public function execute(array $data): Product
    {
        /** @var Product $product */
        $product = Product::create($data);

        $integrationClient = $product->integrationClient();

        if($integrationClient instanceof HasProducts) {
            /**
             * @todo implement DTO (data transfer object) or other design patterns
             * to avoid exposing integration specific model to our domain
             * */
            $integrationProduct = $integrationClient->createProduct($product);

            $product->gateway_product_id = $integrationProduct->id;
            $product->gateway_provider = $product->integration->type;
            $product->status = ProductStatus::active;

            $product->save();
        }

        return $product;
    }
}
