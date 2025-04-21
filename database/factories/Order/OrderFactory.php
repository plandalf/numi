<?php

namespace Database\Factories\Order;

use App\Models\Order\Order;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Enums\OrderStatus;
use App\Models\Checkout\CheckoutSession;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order\Order>
 */
class OrderFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'status' => fake()->randomElement([
                OrderStatus::PENDING->value,
                OrderStatus::COMPLETED->value,
                OrderStatus::CANCELLED->value,
            ]),
            'checkout_session_id' => CheckoutSession::factory(),
            'currency' => fake()->currencyCode(),
            'redirect_url' => fake()->url(),
            'completed_at' => fake()->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
