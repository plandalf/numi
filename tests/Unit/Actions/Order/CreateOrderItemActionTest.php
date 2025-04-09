<?php

namespace Tests\Unit\Actions\Order;

use App\Actions\Order\CreateOrderItemAction;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\Store\Slot;
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
        $organizationId = 1;
        $order = Order::factory()->create([
            'organization_id' => $organizationId,
        ]);

        // Create a Price first to satisfy the foreign key constraint
        $price = Price::factory()->create([
            'organization_id' => $organizationId,
            'amount' => 9999, // $99.99
        ]);

        // Create a Slot with the price
        $slot = Slot::factory()->create([
            'default_price_id' => $price->id,
        ]);

        // Create a CheckoutLineItem with the price and slot
        $checkoutLineItem = CheckoutLineItem::factory()->create([
            'organization_id' => $organizationId,
            'price_id' => $price->id,
            'slot_id' => $slot->id,
            'quantity' => 2,
            'total_amount' => 19998, // $199.98
        ]);

        $action = new CreateOrderItemAction();

        // Act
        $orderItem = $action->execute($order, $checkoutLineItem);

        // Assert
        $this->assertInstanceOf(OrderItem::class, $orderItem);
        $this->assertEquals($organizationId, $orderItem->organization_id);
        $this->assertEquals($order->id, $orderItem->order_id);
        $this->assertEquals($checkoutLineItem->price_id, $orderItem->price_id);
        $this->assertEquals($checkoutLineItem->slot_id, $orderItem->slot_id);
        $this->assertEquals($checkoutLineItem->quantity, $orderItem->quantity);
        $this->assertEquals($checkoutLineItem->total_amount, $orderItem->total_amount);
        $this->assertEquals([], $orderItem->metadata);
    }
}
