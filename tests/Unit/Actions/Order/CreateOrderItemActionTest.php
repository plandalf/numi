<?php

namespace Tests\Unit\Actions\Order;

use App\Actions\Order\CreateOrderItemAction;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\Organization;
use App\Models\Store\OfferItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateOrderItemActionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the action creates an order item from a checkout line item.
     */
    public function test_it_creates_order_item_from_checkout_line_item()
    {
        // Arrange
        $organization = Organization::factory()->create();
        $order = Order::factory()->create([
            'organization_id' => $organization->id,
        ]);

        // Create a Price first to satisfy the foreign key constraint
        $price = Price::factory()->create([
            'organization_id' => $organization->id,
            'amount' => 9999, // $99.99
        ]);

        // Create a offerItem with the price
        $offerItem = OfferItem::factory()->create([
            'default_price_id' => $price->id,
        ]);

        // Create a CheckoutLineItem with the price and offerItem
        $checkoutLineItem = CheckoutLineItem::factory()->create([
            'organization_id' => $organization->id,
            'price_id' => $price->id,
            'offer_item_id' => $offerItem->id,
            'quantity' => 2,
        ]);

        $action = new CreateOrderItemAction;

        // Act
        $orderItem = $action($order, $checkoutLineItem);

        // Assert
        $this->assertInstanceOf(OrderItem::class, $orderItem);
        $this->assertEquals($organization->id, $orderItem->organization_id);
        $this->assertEquals($order->id, $orderItem->order_id);
        $this->assertEquals($checkoutLineItem->price_id, $orderItem->price_id);
        $this->assertEquals($checkoutLineItem->offer_item_id, $orderItem->offer_item_id);
        $this->assertEquals($checkoutLineItem->quantity, $orderItem->quantity);
        $this->assertEquals([], $orderItem->metadata);
    }
}
