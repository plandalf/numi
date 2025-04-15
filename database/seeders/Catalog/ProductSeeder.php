<?php

namespace Database\Seeders\Catalog;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create products with prices
        Product::factory(20)->create()->each(function ($product) {
            // Create prices for different currencies
            foreach (['USD', 'EUR', 'GBP'] as $currency) {
                Price::factory()->create([
                    'product_id' => $product->id,
                    'currency' => $currency,
                ]);
            }
        });
    }
}
