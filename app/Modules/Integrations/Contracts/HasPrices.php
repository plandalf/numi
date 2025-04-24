<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
interface HasPrices
{
    public function createPrice(Price $price, Product $product);

    public function getAllPrices(array $params = []);

    public function searchPrices(array $params = []);
}
