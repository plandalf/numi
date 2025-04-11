<?php

namespace Database\Seeders\Store;

use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Database\Seeder;

class OfferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organization = User::firstWhere('email', UserSeeder::$adminEmail);

        Offer::factory(rand(2, 3))->create([
            'organization_id' => $organization->id,
        ]);
    }
}
