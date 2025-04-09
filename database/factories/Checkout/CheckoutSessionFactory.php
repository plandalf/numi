<?php

namespace Database\Factories\Checkout;

use App\Enums\CheckoutSessionStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Checkout\CheckoutSession>
 */
class CheckoutSessionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = CheckoutSession::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'offer_id' => Offer::factory(),
            'status' => fake()->randomElement([CheckoutSessionStatus::STARTED, CheckoutSessionStatus::CLOSED]),
            'expires_at' => fake()->dateTimeBetween('now', '+1 hour'),
        ];
    }
}
