<?php

namespace Database\Factories;

use App\Enums\ExternalPlatform;
use App\Enums\FulfillmentStatus;
use App\Models\ExternalFulfillment;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExternalFulfillment>
 */
class ExternalFulfillmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = ExternalFulfillment::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $platform = $this->faker->randomElement(ExternalPlatform::cases());
        
        return [
            'organization_id' => Organization::factory(),
            'platform' => $platform,
            'external_order_id' => $this->faker->uuid(),
            'external_fulfillment_id' => $this->faker->optional()->uuid(),
            'status' => $this->faker->randomElement(FulfillmentStatus::cases()),
            'order_data' => $this->generateOrderData($platform),
            'fulfillment_data' => $this->faker->optional()->passthrough($this->generateFulfillmentData($platform)),
            'customer_data' => $this->generateCustomerData($platform),
            'items_data' => $this->generateItemsData($platform),
            'tracking_number' => $this->faker->optional()->regexify('[A-Z0-9]{10,15}'),
            'tracking_url' => $this->faker->optional()->url(),
            'external_order_created_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'external_fulfilled_at' => $this->faker->optional()->dateTimeBetween('-10 days', 'now'),
            'external_delivered_at' => $this->faker->optional()->dateTimeBetween('-5 days', 'now'),
            'webhook_signature' => $this->faker->optional()->sha256(),
            'webhook_headers' => $this->generateWebhookHeaders(),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    /**
     * Generate platform-specific order data.
     */
    private function generateOrderData(ExternalPlatform $platform): array
    {
        return match ($platform) {
            ExternalPlatform::SHOPIFY => [
                'order_number' => $this->faker->numberBetween(1000, 9999),
                'total_price' => $this->faker->randomFloat(2, 10, 500),
                'currency' => 'USD',
                'financial_status' => 'paid',
                'fulfillment_status' => 'unfulfilled',
            ],
            ExternalPlatform::ETSY => [
                'receipt_id' => $this->faker->numberBetween(100000, 999999),
                'total_price' => $this->faker->randomFloat(2, 5, 200),
                'currency_code' => 'USD',
                'payment_method' => 'paypal',
            ],
            ExternalPlatform::CLICKFUNNELS => [
                'order_id' => $this->faker->numberBetween(10000, 99999),
                'total_amount' => $this->faker->randomFloat(2, 20, 1000),
                'currency' => 'USD',
                'status' => 'completed',
            ],
            default => [
                'order_id' => $this->faker->uuid(),
                'total_amount' => $this->faker->randomFloat(2, 10, 500),
                'currency' => 'USD',
                'status' => 'paid',
            ],
        };
    }

    /**
     * Generate platform-specific fulfillment data.
     */
    private function generateFulfillmentData(ExternalPlatform $platform): array
    {
        return [
            'fulfillment_id' => $this->faker->uuid(),
            'tracking_company' => $this->faker->randomElement(['UPS', 'FedEx', 'USPS', 'DHL']),
            'tracking_number' => $this->faker->regexify('[A-Z0-9]{10,15}'),
            'created_at' => $this->faker->dateTimeBetween('-5 days', 'now')->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Generate platform-specific customer data.
     */
    private function generateCustomerData(ExternalPlatform $platform): array
    {
        return match ($platform) {
            ExternalPlatform::SHOPIFY => [
                'id' => $this->faker->numberBetween(1000000, 9999999),
                'email' => $this->faker->email(),
                'first_name' => $this->faker->firstName(),
                'last_name' => $this->faker->lastName(),
            ],
            ExternalPlatform::ETSY => [
                'buyer_user_id' => $this->faker->numberBetween(10000, 99999),
                'buyer_email' => $this->faker->email(),
            ],
            default => [
                'id' => $this->faker->uuid(),
                'email' => $this->faker->email(),
                'name' => $this->faker->name(),
            ],
        };
    }

    /**
     * Generate platform-specific items data.
     */
    private function generateItemsData(ExternalPlatform $platform): array
    {
        $itemCount = $this->faker->numberBetween(1, 3);
        $items = [];
        
        for ($i = 0; $i < $itemCount; $i++) {
            $items[] = match ($platform) {
                ExternalPlatform::SHOPIFY => [
                    'id' => $this->faker->numberBetween(1000000, 9999999),
                    'variant_id' => $this->faker->numberBetween(1000000, 9999999),
                    'title' => $this->faker->words(3, true),
                    'quantity' => $this->faker->numberBetween(1, 5),
                    'price' => $this->faker->randomFloat(2, 5, 100),
                ],
                ExternalPlatform::ETSY => [
                    'transaction_id' => $this->faker->numberBetween(1000000, 9999999),
                    'listing_id' => $this->faker->numberBetween(100000, 999999),
                    'title' => $this->faker->words(4, true),
                    'quantity' => $this->faker->numberBetween(1, 3),
                    'price' => $this->faker->randomFloat(2, 10, 50),
                ],
                default => [
                    'id' => $this->faker->uuid(),
                    'name' => $this->faker->words(3, true),
                    'quantity' => $this->faker->numberBetween(1, 5),
                    'price' => $this->faker->randomFloat(2, 5, 100),
                ],
            };
        }
        
        return $items;
    }

    /**
     * Generate webhook headers.
     */
    private function generateWebhookHeaders(): array
    {
        return [
            'content-type' => ['application/json'],
            'user-agent' => ['Platform-Webhook/1.0'],
            'x-webhook-id' => [$this->faker->uuid()],
        ];
    }

    /**
     * Create a Shopify external fulfillment.
     */
    public function shopify(): static
    {
        return $this->state(fn (array $attributes) => [
            'platform' => ExternalPlatform::SHOPIFY,
        ]);
    }

    /**
     * Create an Etsy external fulfillment.
     */
    public function etsy(): static
    {
        return $this->state(fn (array $attributes) => [
            'platform' => ExternalPlatform::ETSY,
        ]);
    }

    /**
     * Create a ClickFunnels external fulfillment.
     */
    public function clickfunnels(): static
    {
        return $this->state(fn (array $attributes) => [
            'platform' => ExternalPlatform::CLICKFUNNELS,
        ]);
    }

    /**
     * Create a fulfilled external fulfillment.
     */
    public function fulfilled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => FulfillmentStatus::FULFILLED,
            'external_fulfilled_at' => $this->faker->dateTimeBetween('-5 days', 'now'),
            'tracking_number' => $this->faker->regexify('[A-Z0-9]{10,15}'),
            'tracking_url' => $this->faker->url(),
        ]);
    }

    /**
     * Create a pending external fulfillment.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => FulfillmentStatus::PENDING,
            'external_fulfilled_at' => null,
            'external_delivered_at' => null,
        ]);
    }
} 