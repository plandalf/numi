<?php

declare(strict_types=1);

use App\Actions\Checkout\CommitSubscriptionChangeAction;
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


uses(RefreshDatabase::class);

function createMockStripeClient(array $subscriptionData = [], array $upcomingData = []): \Stripe\StripeClient
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

function createCheckoutSession(array $overrides = []): CheckoutSession
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
    $offerItem = OfferItem::factory()->for($offer)->for($price)->create();

    $defaults = [
        'organization_id' => $org->id,
        'offer_id' => $offer->id,
        'intent' => 'upgrade',
        'currency' => 'usd',
        'subscription' => 'sub_123',
        'customer' => ['id' => 'cus_123'],
    ];

    $session = CheckoutSession::factory()->create(array_merge($defaults, $overrides));

    CheckoutLineItem::factory()->for($session)->for($offerItem)->create([
        'quantity' => 1,
        'unit_amount' => 2500,
    ]);

    return $session;
}

describe('CommitSubscriptionChangeAction', function () {
    beforeEach(function () {
        $this->action = new CommitSubscriptionChangeAction;
    });

    describe('Successful Commits', function () {
        it('commits upgrade changes successfully', function () {
            $session = createCheckoutSession([
                'subscription' => 'sub_active',
            ]);

            $session->organization->integrations()->create([
                'type' => 'stripe',
                'provider' => ['raw' => ['customer_id' => 'cus_123']],
            ]);

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Upgrade,
                'totals' => ['due_now' => 500, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [
                    'subscription_id' => 'sub_123',
                    'items' => [],
                    'proration_behavior' => 'create_prorations',
                    'proration_date' => now()->timestamp,
                    'trial_end' => null,
                ],
                'actions' => [],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Create a real Stripe integration with mocked client
            $integration = new StripeIntegrationClient($session->organization->integrations->first());

            // Mock the Stripe client
            $mockStripeClient = createMockStripeClient([], [
                'amount_due' => 500,
            ]);

            $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

            $session->shouldReceive('integrationClient')->andReturn($integration);

            $result = $this->action($session);

            expect($result['success'])->toBe(true);
            expect($result['message'])->toBe('Subscription upgrade completed successfully');
            expect($result['signal'])->toBe(SignalID::Upgrade);
            expect($result['result']['subscription_id'])->toBe('sub_123');
        });

        it('commits expansion changes successfully', function () {
            $session = createCheckoutSession([
                'subscription' => 'sub_active',
            ]);

            $session->organization->integrations()->create([
                'type' => 'stripe',
                'provider' => ['raw' => ['customer_id' => 'cus_123']],
            ]);

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Expansion,
                'totals' => ['due_now' => 2500, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [
                    'subscription_id' => 'sub_123',
                    'items' => [],
                    'proration_behavior' => 'create_prorations',
                    'proration_date' => now()->timestamp,
                    'trial_end' => null,
                ],
                'actions' => [],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Create a real Stripe integration with mocked client
            $integration = new StripeIntegrationClient($session->organization->integrations->first());

            // Mock the Stripe client
            $mockStripeClient = createMockStripeClient([], [
                'amount_due' => 2500,
            ]);

            $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

            $session->shouldReceive('integrationClient')->andReturn($integration);

            $result = $this->action($session);

            expect($result['success'])->toBe(true);
            expect($result['message'])->toBe('Subscription expansion completed successfully');
            expect($result['signal'])->toBe(SignalID::Expansion);
        });

        it('commits trial expansion changes successfully', function () {
            $session = createCheckoutSession([
                'subscription' => 'sub_trial',
            ]);

            $session->organization->integrations()->create([
                'type' => 'stripe',
                'provider' => ['raw' => ['customer_id' => 'cus_123']],
            ]);

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Expansion,
                'totals' => ['due_now' => 0, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [
                    'subscription_id' => 'sub_123',
                    'items' => [],
                    'proration_behavior' => 'create_prorations',
                    'proration_date' => now()->timestamp,
                    'trial_end' => now()->addDays(14)->timestamp,
                ],
                'actions' => [
                    'expand_at_trial_end' => [
                        'due_now' => 0,
                        'trial_end' => now()->addDays(14)->toISOString(),
                        'next_period_amount' => 5000,
                        'currency' => 'usd',
                    ],
                ],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Create a real Stripe integration with mocked client
            $integration = new StripeIntegrationClient($session->organization->integrations->first());

            // Mock the Stripe client for trial expansion
            $mockStripeClient = createMockStripeClient([
                'trial_end' => now()->addDays(14)->timestamp,
            ], [
                'amount_due' => 0,
            ]);

            $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

            $session->shouldReceive('integrationClient')->andReturn($integration);

            $result = $this->action($session);

            expect($result['success'])->toBe(true);
            expect($result['message'])->toBe('Trial expansion completed successfully');
            expect($result['signal'])->toBe(SignalID::Expansion);
            expect($result['result']['amount'])->toBe(0);
        });

        it('commits downgrade changes successfully', function () {
            $session = createCheckoutSession([
                'subscription' => 'sub_active',
            ]);

            $session->organization->integrations()->create([
                'type' => 'stripe',
                'provider' => ['raw' => ['customer_id' => 'cus_123']],
            ]);

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Downgrade,
                'totals' => ['due_now' => 0, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [
                    'subscription_id' => 'sub_123',
                    'items' => [],
                    'proration_behavior' => 'create_prorations',
                    'proration_date' => now()->timestamp,
                    'trial_end' => null,
                ],
                'actions' => [],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Create a real Stripe integration with mocked client
            $integration = new StripeIntegrationClient($session->organization->integrations->first());

            // Mock the Stripe client for downgrade
            $mockStripeClient = createMockStripeClient([], [
                'amount_due' => 0,
            ]);

            $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

            $session->shouldReceive('integrationClient')->andReturn($integration);

            $result = $this->action($session);

            expect($result['success'])->toBe(true);
            expect($result['message'])->toBe('Subscription downgrade completed successfully');
            expect($result['signal'])->toBe(SignalID::Downgrade);
        });

        it('commits plan switch changes successfully', function () {
            $session = createCheckoutSession([
                'subscription' => 'sub_trial',
            ]);

            $session->organization->integrations()->create([
                'type' => 'stripe',
                'provider' => ['raw' => ['customer_id' => 'cus_123']],
            ]);

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Switch,
                'totals' => ['due_now' => 0, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [
                    'subscription_id' => 'sub_123',
                    'items' => [],
                    'proration_behavior' => 'create_prorations',
                    'proration_date' => now()->timestamp,
                    'trial_end' => now()->addDays(14)->timestamp,
                ],
                'actions' => [],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Create a real Stripe integration with mocked client
            $integration = new StripeIntegrationClient($session->organization->integrations->first());

            // Mock the Stripe client for plan switch
            $mockStripeClient = createMockStripeClient([
                'trial_end' => now()->addDays(14)->timestamp,
            ], [
                'amount_due' => 0,
            ]);

            $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

            $session->shouldReceive('integrationClient')->andReturn($integration);

            $result = $this->action($session);

            expect($result['success'])->toBe(true);
            expect($result['message'])->toBe('Plan switch completed successfully');
            expect($result['signal'])->toBe(SignalID::Switch);
        });
    });

    describe('Error Handling', function () {
        it('throws exception when preview is disabled', function () {
            $session = createCheckoutSession();

            // Mock the preview action to return disabled
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => false,
                'reason' => 'No subscription found',
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            expect(fn () => $this->action($session))->toThrow(
                \App\Exceptions\CheckoutException::class,
                'Subscription change preview is not available: No subscription found'
            );
        });

        it('throws exception when integration does not support changes', function () {
            $session = createCheckoutSession();

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Upgrade,
                'totals' => ['due_now' => 500, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [],
                'actions' => [],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Mock non-SupportsChangePreview integration
            $mockIntegration = Mockery::mock('stdClass');
            $session->shouldReceive('integrationClient')->andReturn($mockIntegration);

            expect(fn () => $this->action($session))->toThrow(
                \App\Exceptions\CheckoutException::class,
                'Integration does not support subscription changes'
            );
        });

        it('handles integration commit errors gracefully', function () {
            $session = createCheckoutSession();

            $session->organization->integrations()->create([
                'type' => 'stripe',
                'provider' => ['raw' => ['customer_id' => 'cus_123']],
            ]);

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Upgrade,
                'totals' => ['due_now' => 500, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [],
                'actions' => [],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Create a real Stripe integration with mocked client
            $integration = new StripeIntegrationClient($session->organization->integrations->first());

            // Mock the Stripe client to throw an error
            $mockStripeClient = Mockery::mock(\Stripe\StripeClient::class);
            $mockStripeClient->subscriptions = Mockery::mock();
            $mockStripeClient->subscriptions->shouldReceive('retrieve')->andThrow(new Exception('Stripe API error'));

            $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

            $session->shouldReceive('integrationClient')->andReturn($integration);

            expect(fn () => $this->action($session))->toThrow(
                Exception::class,
                'Stripe API error'
            );
        });
    });

    describe('Session Updates', function () {
        it('updates session with change metadata after successful commit', function () {
            $session = createCheckoutSession([
                'subscription' => 'sub_active',
            ]);

            $session->organization->integrations()->create([
                'type' => 'stripe',
                'provider' => ['raw' => ['customer_id' => 'cus_123']],
            ]);

            // Mock the preview action
            $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
            $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                'enabled' => true,
                'signal' => SignalID::Upgrade,
                'totals' => ['due_now' => 500, 'currency' => 'usd'],
                'lines' => [],
                'operations' => [],
                'commit_descriptor' => [
                    'subscription_id' => 'sub_123',
                    'items' => [],
                    'proration_behavior' => 'create_prorations',
                    'proration_date' => now()->timestamp,
                    'trial_end' => null,
                ],
                'actions' => [],
            ]);

            app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

            // Create a real Stripe integration with mocked client
            $integration = new StripeIntegrationClient($session->organization->integrations->first());

            // Mock the Stripe client
            $mockStripeClient = createMockStripeClient([], [
                'amount_due' => 500,
            ]);

            $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

            $session->shouldReceive('integrationClient')->andReturn($integration);

            $result = $this->action($session);

            expect($result['checkout_session'])->toBe($session);
            expect($session->metadata)->toHaveKey('change_signal');
            expect($session->metadata)->toHaveKey('change_result');
            expect($session->metadata['change_signal'])->toBe(SignalID::Upgrade);
        });
    });

    describe('Signal-Specific Messages', function () {
        it('returns appropriate messages for different signals', function () {
            $signals = [
                SignalID::Upgrade => 'Subscription upgrade completed successfully',
                SignalID::Downgrade => 'Subscription downgrade completed successfully',
                SignalID::Expansion => 'Subscription expansion completed successfully',
                SignalID::Contraction => 'Subscription contraction completed successfully',
                SignalID::Switch => 'Plan switch completed successfully',
                SignalID::Convert => 'Trial conversion completed successfully',
                SignalID::Acquisition => 'New subscription created successfully',
            ];

            foreach ($signals as $signal => $expectedMessage) {
                $session = createCheckoutSession([
                    'subscription' => $signal === SignalID::Acquisition ? null : 'sub_active',
                ]);

                $session->organization->integrations()->create([
                    'type' => 'stripe',
                    'provider' => ['raw' => ['customer_id' => 'cus_123']],
                ]);

                // Mock the preview action
                $mockPreviewAction = Mockery::mock(PreviewChangeAdapterAction::class);
                $mockPreviewAction->shouldReceive('__invoke')->andReturn([
                    'enabled' => true,
                    'signal' => $signal,
                    'totals' => ['due_now' => 0, 'currency' => 'usd'],
                    'lines' => [],
                    'operations' => [],
                    'commit_descriptor' => [],
                    'actions' => [],
                ]);

                app()->instance(PreviewChangeAdapterAction::class, $mockPreviewAction);

                // Create a real Stripe integration with mocked client
                $integration = new StripeIntegrationClient($session->organization->integrations->first());

                // Mock the Stripe client
                $mockStripeClient = createMockStripeClient([], [
                    'amount_due' => 0,
                ]);

                $integration->shouldReceive('getStripeClient')->andReturn($mockStripeClient);

                $session->shouldReceive('integrationClient')->andReturn($integration);

                $result = $this->action($session);

                expect($result['message'])->toBe($expectedMessage);
            }
        });
    });
});
