<?php

declare(strict_types=1);

use App\Actions\Checkout\PreviewSubscriptionChangeAction;
use App\Enums\ChargeType;
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
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

function fakeStripeClientForPreview(array $subscriptionOverrides = [], array $upcomingOverrides = []) {
    // Build a minimal Stripe-like object graph using stdClass
    $product = (object) ['id' => 'prod_base', 'name' => 'Base Product'];
    $currentPrice = (object) ['id' => 'price_current', 'recurring' => (object) ['interval' => 'month'], 'product' => $product];
    $baseItem = (object) ['id' => 'si_base', 'price' => $currentPrice, 'quantity' => 1];

    $subscription = (object) array_merge([
        'id' => 'sub_123',
        'status' => 'active',
        'trial_end' => null,
        'current_period_end' => now()->addMonth()->timestamp,
        'customer' => 'cus_123',
        'items' => (object) ['data' => [$baseItem]],
    ], $subscriptionOverrides);

    $upcoming = (object) array_merge([
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
                        'product' => $product,
                    ],
                ],
            ],
        ],
    ], $upcomingOverrides);

    $stripe = new class($subscription, $upcoming) {
        public function __construct(public $subscription, public $upcoming) {}
        public $subscriptions;
        public $invoices;
        public function getSubscriptions()
        {
            return new class($this->subscription) {
                public function __construct(public $subscription) {}
                public function retrieve($id, $opts = [])
                {
                    return $this->subscription;
                }
            };
        }
        public function getInvoices()
        {
            return new class($this->upcoming) {
                public function __construct(public $upcoming) {}
                public function upcoming($params)
                {
                    return $this->upcoming;
                }
            };
        }
        public function __get($name)
        {
            if ($name === 'subscriptions') return $this->subscriptions ??= $this->getSubscriptions();
            if ($name === 'invoices') return $this->invoices ??= $this->getInvoices();
            return null;
        }
    };

    $integration = Mockery::mock(StripeIntegrationClient::class, [new Integration()])->makePartial();
    $integration->shouldReceive('getStripeClient')->andReturn($stripe);

    return $integration;
}

it('returns disabled when not an upgrade session', function () {
    $org = Organization::factory()->create();
    $offer = Offer::factory()->for($org)->create();

    $session = CheckoutSession::factory()->create([
        'organization_id' => $org->id,
        'offer_id' => $offer->id,
        'intent' => 'purchase',
        'subscription' => null,
    ]);

    $action = app(PreviewSubscriptionChangeAction::class);
    $res = $action($session);
    expect($res['enabled'])->toBeFalse();
});

it('previews swap of base plan only and is trial/period aware', function () {
    $org = Organization::factory()->create();
    $offer = Offer::factory()->for($org)->create();

    // Product + recurring price acts as base
    $product = Product::factory()->for($org)->create();
    $price = Price::factory()->for($product)->create([
        'organization_id' => $org->id,
        'type' => ChargeType::RECURRING,
        'gateway_price_id' => 'price_new',
        'renew_interval' => 'month',
        'is_active' => true,
    ]);

    $item = OfferItem::factory()->for($offer)->create([
        'default_price_id' => $price->id,
        'is_required' => true,
        'type' => \App\Enums\Store\OfferItemType::STANDARD,
    ]);

    $session = CheckoutSession::factory()->create([
        'organization_id' => $org->id,
        'offer_id' => $offer->id,
        'payments_integration_id' => Integration::factory()->for($org)->create()->id,
        'intent' => 'upgrade',
        'subscription' => 'sub_123',
    ]);

    CheckoutLineItem::factory()->create([
        'checkout_session_id' => $session->id,
        'offer_item_id' => $item->id,
        'price_id' => $price->id,
        'quantity' => 1,
    ]);

    // Swap real integration client with fake that returns consistent data
    $integration = fakeStripeClientForPreview(
        // on trial now, trial ends soon
        ['status' => 'trialing', 'trial_end' => now()->addDays(3)->timestamp]
    );

    // Bind the integration client accessor for this session
    // Use a closure to override integrationClient() via macro-like approach
    CheckoutSession::macro('integrationClient', function () use ($integration) {
        return $integration;
    });

    $action = app(PreviewSubscriptionChangeAction::class);
    $res = $action($session, null);

    expect($res['enabled'])->toBeTrue();
    expect($res['effective']['strategy'])->toBe('at_trial_end');
    expect($res['proposed']['base_item']['stripe_price'])->toBe('price_new');
    expect($res['delta']['total_due_at_effective'])->toBeInt();
});


