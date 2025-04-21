<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Catalog\Product;

interface CanCreateProducts
{
    public function createProduct(Product $product);
}
