<?php

declare(strict_types=1);

namespace App\Actions\Price;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;

// Keep Product for authorization context if needed
// Optional: explicit authorization check

class DestroyPrice
{
    public function __invoke(Product $product, Price $price): void
    {
        // Optional: Explicitly check if the user can delete this price via the product policy
        // Gate::authorize('deletePrice', [$product, $price]);

        // TODO: Add logic for gateway provider price deletion/archival if needed

        $price->delete();
    }
}
