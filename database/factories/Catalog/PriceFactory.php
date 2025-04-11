<?php

namespace Database\Factories\Catalog;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Catalog\Price>
 */
class PriceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Price::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'type' => fake()->randomElement(['fixed', 'recurring']),
            'product_id' => Product::factory(),
            'lookup_key' => fake()->unique()->bothify('PRICE-####-???'),
            'organization_id' => Organization::factory(),
            'amount' => fake()->numberBetween(100, 1000),
            'currency' => fake()->currencyCode(),
            'recurring_interval_count' => fake()->numberBetween(1, 12),
            'cancel_after_cycles' => fake()->numberBetween(0, 12),
            'properties' => fake()->randomElement([null, fake()->word()]),
            'gateway_provider' => fake()->randomElement(['stripe', 'paypal']),
            'gateway_price_id' => fake()->uuid(),
            'is_active' => fake()->boolean(),
        ];
    }
}
