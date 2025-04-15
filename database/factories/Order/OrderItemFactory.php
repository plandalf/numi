<?php

namespace Database\Factories\Order;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\Organization;
use App\Models\Store\Slot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order\OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = OrderItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 5);

        return [
            'organization_id' => Organization::factory(),
            'order_id' => Order::factory(),
            'price_id' => Price::factory(),
            'slot_id' => Slot::factory(),
            'quantity' => $quantity,
        ];
    }
}
