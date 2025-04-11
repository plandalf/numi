<?php

namespace Database\Factories\Store;

use App\Models\Organization;
use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Store\Offer>
 */
class OfferFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Offer::class;

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
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['draft', 'published', 'archived']),
            'view' => fake()->randomElement(['grid', 'list']),
            'properties' => fake()->randomElement([null, fake()->word()]),
        ];
    }
}
