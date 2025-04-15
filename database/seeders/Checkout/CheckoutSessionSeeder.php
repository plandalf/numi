<?php

namespace Database\Seeders\Checkout;

use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Database\Seeder;

class CheckoutSessionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organization = User::firstWhere('email', UserSeeder::$adminEmail);

        CheckoutSession::factory(rand(2, 3))->create([
            'organization_id' => $organization->id,
        ])->each(function ($session) use ($organization) {
            // Create 1-2 line items per session
            CheckoutLineItem::factory(rand(1, 2))->create([
                'checkout_session_id' => $session->id,
                'organization_id' => $organization->id,
            ]);
        });
    }
}
