<?php

namespace Database\Seeders;

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
            ThemeSeeder::class,
            AppSeeder::class,
            ConnectionSeeder::class,
            // ProductSeeder::class,
            // OfferSeeder::class,
            // CheckoutSessionSeeder::class,
            // OrderSeeder::class,
        ]);

        $this->call([
            // TemplateSeeder::class,
        ]);
    }
}
