<?php

namespace Database\Factories\Catalog;

use App\Models\Catalog\Product;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Catalog\Product>
 */
class ProductFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->words(3, true),
            'lookup_key' => fake()->unique()->bothify('PROD-####-???'),
            'gateway_provider' => fake()->randomElement(['stripe', 'stripe_test']),
            'gateway_product_id' => fake()->uuid(),
        ];
    }
}
