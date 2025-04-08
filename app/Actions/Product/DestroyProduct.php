<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Models\Catalog\Product;

class DestroyProduct
{
    public function __invoke(Product $product): void
    {
        // Consider implications: Should associated prices be deleted/archived?
        // For now, relying on soft deletes or cascade constraints if set.
        $product->delete();
    }
}
