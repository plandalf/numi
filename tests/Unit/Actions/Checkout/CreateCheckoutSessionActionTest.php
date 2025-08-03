<?php

namespace Tests\Unit\Actions\Checkout;

use App\Actions\Checkout\CreateCheckoutLineItemAction;
use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class CreateCheckoutSessionActionTest extends TestCase
{
    use RefreshDatabase;

    private CreateCheckoutSessionAction $action;

    private $createCheckoutLineItemAction;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock the dependency
        $this->createCheckoutLineItemAction = Mockery::mock(CreateCheckoutLineItemAction::class);

        $this->action = new CreateCheckoutSessionAction(
            $this->createCheckoutLineItemAction
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_it_creates_checkout_session_with_line_items(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $offer = Offer::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $price1 = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 1000, // $10.00
        ]);

        $price2 = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 2000, // $20.00
        ]);

        $offerItem1 = OfferItem::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => $price1->id,
        ]);

        $offerItem2 = OfferItem::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => $price2->id,
        ]);

        $offerItem3 = OfferItem::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => null, // This offerItem should be skipped
        ]);

        // Mock the CreateCheckoutLineItemAction for each offerItem with a default_price_id
        $this->createCheckoutLineItemAction
            ->expects('execute')
            ->twice()
            ->andReturnUsing(function ($checkoutSession, $offerItem) {
                // Get the price amount directly from the database to avoid lazy loading
                $priceAmount = Price::find($offerItem->default_price_id)->amount;

                return CheckoutLineItem::factory()->create([
                    'organization_id' => $checkoutSession->organization_id,
                    'checkout_session_id' => $checkoutSession->id,
                    'price_id' => $offerItem->default_price_id,
                    'offer_item_id' => $offerItem->id,
                    'quantity' => 1,
                ]);
            });

        // Act
        $checkoutSession = $this->action->execute($offer, []);

        // Assert
        $this->assertInstanceOf(CheckoutSession::class, $checkoutSession);
        $this->assertEquals($offer->organization_id, $checkoutSession->organization_id);
        $this->assertEquals($offer->id, $checkoutSession->offer_id);

        // Verify that line items were created for offerItems with default_price_id
        $this->assertEquals(2, $checkoutSession->lineItems()->count());
    }

    public function test_it_applies_interval_override_to_offer_items(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $offer = Offer::factory()->create([
            'organization_id' => $organization->id,
        ]);

        // Parent price (monthly)
        $parentPrice = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 1000,
            'renew_interval' => 'month',
            'currency' => 'USD',
            'type' => 'recurring',
            'is_active' => true,
        ]);

        // Child price (yearly)
        $childPrice = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 10000,
            'renew_interval' => 'year',
            'currency' => 'USD',
            'parent_list_price_id' => $parentPrice->id,
            'type' => 'recurring',
            'is_active' => true,
        ]);

        $offerItem = OfferItem::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => $parentPrice->id,
            'is_required' => true,
        ]);

        // Mock the CreateCheckoutLineItemAction - expect it to be called with child price
        $this->createCheckoutLineItemAction
            ->expects('execute')
            ->once()
            ->with(
                Mockery::type(CheckoutSession::class),
                $offerItem,
                Mockery::on(function ($priceId) use ($childPrice) {
                    return $priceId === $childPrice->id;
                }),
                1
            )
            ->andReturn(CheckoutLineItem::factory()->create([
                'price_id' => $childPrice->id,
                'offer_item_id' => $offerItem->id,
                'quantity' => 1,
            ]));

        // Act - call with interval override (empty checkoutItems will use offer items)
        $checkoutSession = $this->action->execute($offer, [], false, 'year', null);

        // Assert
        $this->assertInstanceOf(CheckoutSession::class, $checkoutSession);
    }

    public function test_it_applies_currency_override_to_offer_items(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $offer = Offer::factory()->create([
            'organization_id' => $organization->id,
        ]);

        // Parent price (USD)
        $parentPrice = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 1000,
            'renew_interval' => 'month',
            'currency' => 'USD',
            'type' => 'recurring',
            'is_active' => true,
        ]);

        // Child price (EUR)
        $childPrice = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 900,
            'renew_interval' => 'month',
            'currency' => 'EUR',
            'parent_list_price_id' => $parentPrice->id,
            'type' => 'recurring',
            'is_active' => true,
        ]);

        $offerItem = OfferItem::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => $parentPrice->id,
            'is_required' => true,
        ]);

        // Mock the CreateCheckoutLineItemAction - expect it to be called with child price
        $this->createCheckoutLineItemAction
            ->expects('execute')
            ->once()
            ->with(
                Mockery::type(CheckoutSession::class),
                $offerItem,
                Mockery::on(function ($priceId) use ($childPrice) {
                    return $priceId === $childPrice->id;
                }),
                1
            )
            ->andReturn(CheckoutLineItem::factory()->create([
                'price_id' => $childPrice->id,
                'offer_item_id' => $offerItem->id,
                'quantity' => 1,
            ]));

        // Act - call with currency override
        $checkoutSession = $this->action->execute($offer, [], false, null, 'eur');

        // Assert
        $this->assertInstanceOf(CheckoutSession::class, $checkoutSession);
    }

    public function test_it_uses_parent_price_when_already_matching_overrides(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $offer = Offer::factory()->create([
            'organization_id' => $organization->id,
        ]);

        // Parent price already matches the requested interval
        $parentPrice = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 10000,
            'renew_interval' => 'year', // Already yearly
            'currency' => 'USD',
            'type' => 'recurring',
            'is_active' => true,
        ]);

        $offerItem = OfferItem::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => $parentPrice->id,
            'is_required' => true,
        ]);

        // Mock the CreateCheckoutLineItemAction - expect it to be called with parent price
        $this->createCheckoutLineItemAction
            ->expects('execute')
            ->once()
            ->with(
                Mockery::type(CheckoutSession::class),
                $offerItem,
                Mockery::on(function ($priceId) use ($parentPrice) {
                    return $priceId === $parentPrice->id;
                }),
                1
            )
            ->andReturn(CheckoutLineItem::factory()->create([
                'price_id' => $parentPrice->id,
                'offer_item_id' => $offerItem->id,
                'quantity' => 1,
            ]));

        // Act - call with interval override that parent already matches
        $checkoutSession = $this->action->execute($offer, [], false, 'year', null);

        // Assert
        $this->assertInstanceOf(CheckoutSession::class, $checkoutSession);
    }
}
