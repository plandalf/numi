<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Media>
 */
class MediaFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = \App\Models\Media::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'model_type' => fake()->randomElement(['App\Models\Product', 'App\Models\Organization']),
            'model_id' => fake()->numberBetween(1, 100),
            'collection_name' => fake()->randomElement(['avatar', 'logo', 'product_image']),
            'name' => fake()->uuid(),
            'file_name' => fake()->uuid() . '.jpg',
            'mime_type' => 'image/jpeg',
            'disk' => 'public',
            'conversions_disk' => 'public',
            'size' => fake()->numberBetween(1000, 5000000),
            'manipulations' => [],
            'custom_properties' => [],
            'generated_conversions' => [],
            'responsive_images' => [],
            'order_column' => fake()->numberBetween(1, 100),
        ];
    }
}
