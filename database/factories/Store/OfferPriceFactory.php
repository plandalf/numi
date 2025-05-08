<?php

namespace Database\Factories\Store;

use App\Models\Catalog\Price;
use App\Models\Store\Offer;
use App\Models\Store\OfferPrice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Store\OfferPrice>
 */
class OfferPriceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = OfferPrice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'offer_id' => Offer::factory(),
            'price_id' => Price::factory(),
        ];
    }
}
