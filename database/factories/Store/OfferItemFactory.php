<?php

namespace Database\Factories\Store;

use App\Models\Catalog\Price;
use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Store\OfferItem>
 */
class OfferItemFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = OfferItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'offer_id' => Offer::factory(),
            'key' => fake()->slug(2),
            'default_price_id' => Price::factory(),
            'is_required' => fake()->boolean(70),
            'sort_order' => fake()->numberBetween(1, 100),
        ];
    }
}
