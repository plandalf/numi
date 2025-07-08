<?php

namespace Tests\Feature;

use App\Enums\IntegrationType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Integration;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutSessionPaymentMethodFilteringTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Organization $organization;
    private Integration $integration;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->organization = Organization::factory()->create();
        $this->user->organizations()->attach($this->organization->id, ['role' => 'owner']);
        
        // Create a Stripe integration with BNPL payment methods enabled
        $this->integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'type' => IntegrationType::STRIPE,
            'config' => [
                'payment_methods' => ['card', 'afterpay_clearpay', 'affirm', 'klarna'],
                'access_token' => [
                    'stripe_publishable_key' => 'pk_test_test',
                ],
            ],
        ]);
    }

    public function test_payment_methods_filtered_by_amount_under_limits()
    {
        // Create a product with a price under the limits
        $product = Product::factory()->create(['organization_id' => $this->organization->id]);
        $price = Price::factory()->create([
            'product_id' => $product->id,
            'amount' => 150000, // $1,500 USD
            'currency' => 'usd',
        ]);

        // Create checkout session
        $session = CheckoutSession::factory()->create([
            'organization_id' => $this->organization->id,
            'test_mode' => true,
        ]);

        // Add line item
        CheckoutLineItem::factory()->create([
            'checkout_session_id' => $session->id,
            'price_id' => $price->id,
            'quantity' => 1,
            'total' => 150000,
        ]);

        // Get enabled payment methods
        $enabledMethods = $session->enabled_payment_methods;

        // At $1,500 USD, all methods should be available except klarna ($1,000 limit)
        $this->assertContains('card', $enabledMethods);
        $this->assertContains('afterpay_clearpay', $enabledMethods);
        $this->assertContains('affirm', $enabledMethods);
        $this->assertNotContains('klarna', $enabledMethods);
    }

    public function test_payment_methods_filtered_by_amount_over_limits()
    {
        // Create a product with a price over the limits
        $product = Product::factory()->create(['organization_id' => $this->organization->id]);
        $price = Price::factory()->create([
            'product_id' => $product->id,
            'amount' => 250000, // $2,500 USD
            'currency' => 'usd',
        ]);

        // Create checkout session
        $session = CheckoutSession::factory()->create([
            'organization_id' => $this->organization->id,
            'test_mode' => true,
        ]);

        // Add line item
        CheckoutLineItem::factory()->create([
            'checkout_session_id' => $session->id,
            'price_id' => $price->id,
            'quantity' => 1,
            'total' => 250000,
        ]);

        // Get enabled payment methods
        $enabledMethods = $session->enabled_payment_methods;

        // At $2,500 USD, only card should be available
        $this->assertContains('card', $enabledMethods);
        $this->assertNotContains('afterpay_clearpay', $enabledMethods);
        $this->assertNotContains('affirm', $enabledMethods);
        $this->assertNotContains('klarna', $enabledMethods);
    }

    public function test_setup_mode_does_not_filter_by_amount()
    {
        // Create a recurring product (setup mode)
        $product = Product::factory()->create(['organization_id' => $this->organization->id]);
        $price = Price::factory()->create([
            'product_id' => $product->id,
            'amount' => 250000, // $2,500 USD
            'currency' => 'usd',
            'type' => 'recurring',
            'renew_interval' => 'month',
        ]);

        // Create checkout session
        $session = CheckoutSession::factory()->create([
            'organization_id' => $this->organization->id,
            'test_mode' => true,
        ]);

        // Add line item
        CheckoutLineItem::factory()->create([
            'checkout_session_id' => $session->id,
            'price_id' => $price->id,
            'quantity' => 1,
            'total' => 250000,
        ]);

        // Get enabled payment methods
        $enabledMethods = $session->enabled_payment_methods;

        // In setup mode, all methods should be available regardless of amount
        $this->assertContains('card', $enabledMethods);
        $this->assertContains('afterpay_clearpay', $enabledMethods);
        $this->assertContains('affirm', $enabledMethods);
        $this->assertContains('klarna', $enabledMethods);
    }
} 