<?php

namespace Database\Seeders\Order;

use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\Organization;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organization = User::firstWhere('email', UserSeeder::$adminEmail);

        Order::factory(rand(5, 10))->create([
            'organization_id' => $organization->id,
        ])->each(function ($order) use ($organization) {
            OrderItem::factory(rand(1, 5))->create([
                'order_id' => $order->id,
                'organization_id' => $organization->id,
            ]);
        });
    }
}
