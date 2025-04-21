<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
interface CanCreatePrice
{
    public function createPrice(Price $price, Product $product);
}
