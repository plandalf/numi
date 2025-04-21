<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Catalog\Product;

interface HasProducts
{
    public function createProduct(Product $product);

    public function getAllProducts(array $params = []);

    public function searchProducts(array $params = []);
}
