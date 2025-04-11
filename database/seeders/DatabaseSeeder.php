<?php

namespace Database\Seeders;

use Database\Seeders\Catalog\ProductSeeder;
use Database\Seeders\Checkout\CheckoutSessionSeeder;
use Database\Seeders\Order\OrderSeeder;
use Database\Seeders\Store\OfferSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            OrganizationSeeder::class,
            ProductSeeder::class,
            OfferSeeder::class,
            CheckoutSessionSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
