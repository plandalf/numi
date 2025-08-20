<?php

declare(strict_types=1);

use App\Actions\Checkout\PreviewChangeAdapterAction;
use App\Enums\SignalID;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Integration;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use App\Modules\Integrations\Stripe\Stripe as StripeIntegrationClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PreviewChangeAdapterActionTest extends TestCase
{
    use RefreshDatabase;

    private PreviewChangeAdapterAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new PreviewChangeAdapterAction();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function createMockStripeClient(array $subscriptionData = [], array $upcomingData = []): \Stripe\StripeClient
    {
        $defaultSubscription = [
            'id' => 'sub_123',
            'status' => 'active',
            'trial_end' => null,
            'current_period_end' => now()->addMonth()->timestamp,
            'customer' => 'cus_123',
            'items' => (object) [
                'data' => [
                    (object) [
                        'id' => 'si_base',
                        'price' => (object) [
                            'id' => 'price_current',
                            'unit_amount' => 2500,
                            'recurring' => (object) ['interval' => 'month'],
                            'product' => (object) ['id' => 'prod_base', 'name' => 'Base Product'],
                        ],
                        'quantity' => 1,
                    ],
                ],
            ],
        ];

        $defaultUpcoming = [
            'amount_due' => 500,
            'currency' => 'usd',
            'lines' => (object) [
                'data' => [
                    (object) [
                        'id' => 'il_proration',
                        'description' => 'Proration',
                        'amount' => 500,
                        'currency' => 'usd',
                        'proration' => true,
                        'period' => null,
                        'price' => (object) [
                            'id' => 'price_new',
                            'recurring' => (object) ['interval' => 'month'],
                            'product' => (object) ['id' => 'prod_base', 'name' => 'Base Product'],
                        ],
                    ],
                ],
            ],
        ];

        $subscription = (object) array_merge($defaultSubscription, $subscriptionData);
        $upcoming = (object) array_merge($defaultUpcoming, $upcomingData);

        $stripeClient = Mockery::mock(\Stripe\StripeClient::class);
        
        $stripeClient->subscriptions = Mockery::mock();
        $stripeClient->subscriptions->shouldReceive('retrieve')->andReturn($subscription);
        
        $stripeClient->invoices = Mockery::mock();
        $stripeClient->invoices->shouldReceive('upcoming')->andReturn($upcoming);

        return $stripeClient;
    }

    private function createCheckoutSession(array $overrides = []): CheckoutSession
    {
        $org = Organization::factory()->create();
        $offer = Offer::factory()->for($org)->create();
        $product = Product::factory()->create(['name' => 'Test Product']);
        $price = Price::factory()->for($product)->create([
            'amount' => 2500,
            'currency' => 'usd',
            'type' => 'recurring',
            'renew_interval' => 'month',
        ]);
        $offerItem = OfferItem::factory()->for($offer)->create([
            'default_price_id' => $price->id,
        ]);

        $defaults = [
            'organization_id' => $org->id,
            'offer_id' => $offer->id,
            'intent' => 'upgrade',
            'currency' => 'usd',
            'subscription' => 'sub_123',
        ];

        $session = CheckoutSession::factory()->create(array_merge($defaults, $overrides));

        CheckoutLineItem::factory()->create([
            'checkout_session_id' => $session->id,
            'offer_item_id' => $offerItem->id,
            'price_id' => $price->id,
            'quantity' => 1,
            'organization_id' => $org->id,
        ]);

        return $session;
    }

    public function test_classifies_new_trial_subscriptions_as_acquisition(): void
    {
        $session = $this->createCheckoutSession([
            'intent' => 'upgrade',
            'subscription' => null, // No existing subscription
        ]);

        $result = $this->action->__invoke($session);

        $this->assertTrue($result['enabled']);
        $this->assertEquals('Acquisition', $result['signal']);
        $this->assertEquals(0, $result['totals']['due_now']);
        $this->assertArrayHasKey('start_trial', $result['actions']);
        $this->assertArrayHasKey('skip_trial', $result['actions']);
    }

    public function test_classifies_trial_to_paid_conversion_as_convert(): void
    {
        $session = Mockery::mock(CheckoutSession::class);
        $session->shouldReceive('loadMissing')->andReturnSelf();
        $session->shouldReceive('subscription')->andReturn('sub_trial');
        $session->shouldReceive('intent')->andReturn('upgrade');
        $session->shouldReceive('lineItems')->andReturn(collect([]));
        $session->shouldReceive('organization')->andReturn((object) ['integrations' => collect([])]);

        // Mock the integration client
        $mockIntegration = Mockery::mock(StripeIntegrationClient::class);
        $mockIntegration->shouldReceive('previewChange')->andReturn([
            'enabled' => true,
            'signal' => 'Convert',
            'totals' => ['due_now' => 2500, 'currency' => 'usd'],
            'lines' => [],
            'operations' => [],
            'commit_descriptor' => [],
            'actions' => [],
        ]);

        $session->shouldReceive('integrationClient')->andReturn($mockIntegration);

        $result = $this->action->__invoke($session);

        $this->assertTrue($result['enabled']);
        $this->assertEquals('Convert', $result['signal']);
    }

    public function test_classifies_plan_changes_during_trial_as_switch(): void
    {
        $session = Mockery::mock(CheckoutSession::class);
        $session->shouldReceive('loadMissing')->andReturnSelf();
        $session->shouldReceive('subscription')->andReturn('sub_trial');
        $session->shouldReceive('intent')->andReturn('upgrade');
        $session->shouldReceive('lineItems')->andReturn(collect([]));
        $session->shouldReceive('organization')->andReturn((object) ['integrations' => collect([])]);

        // Mock the integration client
        $mockIntegration = Mockery::mock(StripeIntegrationClient::class);
        $mockIntegration->shouldReceive('previewChange')->andReturn([
            'enabled' => true,
            'signal' => 'Switch',
            'totals' => ['due_now' => 0, 'currency' => 'usd'],
            'lines' => [],
            'operations' => [],
            'commit_descriptor' => [],
            'actions' => [],
        ]);

        $session->shouldReceive('integrationClient')->andReturn($mockIntegration);

        $result = $this->action->__invoke($session);

        $this->assertTrue($result['enabled']);
        $this->assertEquals('Switch', $result['signal']);
    }

    public function test_classifies_upgrades_as_upgrade(): void
    {
        $session = Mockery::mock(CheckoutSession::class);
        $session->shouldReceive('loadMissing')->andReturnSelf();
        $session->shouldReceive('subscription')->andReturn('sub_active');
        $session->shouldReceive('intent')->andReturn('upgrade');
        $session->shouldReceive('lineItems')->andReturn(collect([]));
        $session->shouldReceive('organization')->andReturn((object) ['integrations' => collect([])]);

        // Mock the integration client
        $mockIntegration = Mockery::mock(StripeIntegrationClient::class);
        $mockIntegration->shouldReceive('previewChange')->andReturn([
            'enabled' => true,
            'signal' => 'Upgrade',
            'totals' => ['due_now' => 500, 'currency' => 'usd'],
            'lines' => [],
            'operations' => [],
            'commit_descriptor' => [],
            'actions' => [],
        ]);

        $session->shouldReceive('integrationClient')->andReturn($mockIntegration);

        $result = $this->action->__invoke($session);

        $this->assertTrue($result['enabled']);
        $this->assertEquals('Upgrade', $result['signal']);
    }

    public function test_classifies_expansions_as_expansion(): void
    {
        $session = Mockery::mock(CheckoutSession::class);
        $session->shouldReceive('loadMissing')->andReturnSelf();
        $session->shouldReceive('subscription')->andReturn('sub_active');
        $session->shouldReceive('intent')->andReturn('upgrade');
        $session->shouldReceive('lineItems')->andReturn(collect([]));
        $session->shouldReceive('organization')->andReturn((object) ['integrations' => collect([])]);

        // Mock the integration client
        $mockIntegration = Mockery::mock(StripeIntegrationClient::class);
        $mockIntegration->shouldReceive('previewChange')->andReturn([
            'enabled' => true,
            'signal' => 'Expansion',
            'totals' => ['due_now' => 2500, 'currency' => 'usd'],
            'lines' => [],
            'operations' => [],
            'commit_descriptor' => [],
            'actions' => [],
        ]);

        $session->shouldReceive('integrationClient')->andReturn($mockIntegration);

        $result = $this->action->__invoke($session);

        $this->assertTrue($result['enabled']);
        $this->assertEquals('Expansion', $result['signal']);
    }

    public function test_handles_one_time_purchases_correctly(): void
    {
        $session = $this->createCheckoutSession([
            'intent' => 'purchase',
            'subscription' => null,
        ]);

        $result = $this->action->__invoke($session);

        $this->assertTrue($result['enabled']);
        $this->assertEquals('Acquisition', $result['signal']);
        $this->assertEquals(0, $result['totals']['due_now']); // Trial acquisition
    }

    public function test_returns_disabled_when_integration_does_not_support_change_previews(): void
    {
        $session = Mockery::mock(CheckoutSession::class);
        $session->shouldReceive('loadMissing')->andReturnSelf();
        $session->shouldReceive('subscription')->andReturn('sub_123');
        $session->shouldReceive('intent')->andReturn('upgrade');
        $session->shouldReceive('lineItems')->andReturn(collect([]));
        $session->shouldReceive('organization')->andReturn((object) ['integrations' => collect([])]);

        $mockIntegration = Mockery::mock('stdClass'); // Non-SupportsChangePreview integration
        $session->shouldReceive('integrationClient')->andReturn($mockIntegration);

        $result = $this->action->__invoke($session);

        $this->assertFalse($result['enabled']);
        $this->assertEquals('Integration does not support change previews', $result['reason']);
    }

    public function test_handles_integration_errors_gracefully(): void
    {
        $session = Mockery::mock(CheckoutSession::class);
        $session->shouldReceive('loadMissing')->andReturnSelf();
        $session->shouldReceive('subscription')->andReturn('sub_123');
        $session->shouldReceive('intent')->andReturn('upgrade');
        $session->shouldReceive('lineItems')->andReturn(collect([]));
        $session->shouldReceive('organization')->andReturn((object) ['integrations' => collect([])]);

        // Mock the integration client to throw an error
        $mockIntegration = Mockery::mock(StripeIntegrationClient::class);
        $mockIntegration->shouldReceive('previewChange')->andThrow(new Exception('Stripe API error'));

        $session->shouldReceive('integrationClient')->andReturn($mockIntegration);

        $result = $this->action->__invoke($session);

        $this->assertFalse($result['enabled']);
        $this->assertStringContainsString('Stripe API error', $result['reason']);
    }
}
