<?php

namespace Tests\Unit\Actions\Checkout;

use App\Actions\Checkout\CreateCheckoutLineItemAction;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Organization;
use App\Models\Store\OfferItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateCheckoutLineItemActionTest extends TestCase
{
    use RefreshDatabase;

    private CreateCheckoutLineItemAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new CreateCheckoutLineItemAction;
    }

    public function test_it_creates_checkout_line_item(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $checkoutSession = CheckoutSession::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $price = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 1000, // $10.00
        ]);

        $offerItem = OfferItem::factory()->create([
            'default_price_id' => $price->id,
        ]);

        // Act
        $lineItem = $this->action->execute($checkoutSession, $offerItem);

        // Assert
        $this->assertInstanceOf(CheckoutLineItem::class, $lineItem);
        $this->assertEquals($checkoutSession->organization_id, $lineItem->organization_id);
        $this->assertEquals($checkoutSession->id, $lineItem->checkout_session_id);
        $this->assertEquals($offerItem->default_price_id, $lineItem->price_id);
        $this->assertEquals($offerItem->id, $lineItem->offer_item_id);
        $this->assertEquals(1, $lineItem->quantity);
    }
}
