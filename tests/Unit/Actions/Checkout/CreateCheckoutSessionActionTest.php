<?php

namespace Tests\Unit\Actions\Checkout;

use App\Actions\Checkout\CreateCheckoutLineItemAction;
use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\Store\Slot;
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

        $slot1 = Slot::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => $price1->id,
        ]);

        $slot2 = Slot::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => $price2->id,
        ]);

        $slot3 = Slot::factory()->create([
            'offer_id' => $offer->id,
            'default_price_id' => null, // This slot should be skipped
        ]);

        // Mock the CreateCheckoutLineItemAction for each slot with a default_price_id
        $this->createCheckoutLineItemAction
            ->expects('execute')
            ->twice()
            ->andReturnUsing(function ($checkoutSession, $slot) {
                // Get the price amount directly from the database to avoid lazy loading
                $priceAmount = Price::find($slot->default_price_id)->amount;

                return CheckoutLineItem::factory()->create([
                    'organization_id' => $checkoutSession->organization_id,
                    'checkout_session_id' => $checkoutSession->id,
                    'price_id' => $slot->default_price_id,
                    'slot_id' => $slot->id,
                    'quantity' => 1,
                    'total_amount' => $priceAmount,
                ]);
            });

        // Act
        $checkoutSession = $this->action->execute($offer);

        // Assert
        $this->assertInstanceOf(CheckoutSession::class, $checkoutSession);
        $this->assertEquals($offer->organization_id, $checkoutSession->organization_id);
        $this->assertEquals($offer->id, $checkoutSession->offer_id);

        // Verify that line items were created for slots with default_price_id
        $this->assertEquals(2, $checkoutSession->lineItems()->count());
    }
}
