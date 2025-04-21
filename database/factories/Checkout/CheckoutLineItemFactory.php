<?php

namespace Database\Factories\Checkout;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Organization;
use App\Models\Store\Slot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Checkout\CheckoutLineItem>
 */
class CheckoutLineItemFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = CheckoutLineItem::class;

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
            'checkout_session_id' => CheckoutSession::factory(),
            'price_id' => Price::factory(),
            'slot_id' => Slot::factory(),
            'quantity' => $quantity,
        ];
    }
}
