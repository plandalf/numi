<?php

namespace App\Actions\Order;

use App\Models\Checkout\CheckoutLineItem;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;

class CreateOrderItemAction
{
    /**
     * Create an order item from a checkout line item.
     *
     * @param Order $order
     * @param CheckoutLineItem $checkoutLineItem
     * @return OrderItem
     */
    public function __invoke(Order $order, CheckoutLineItem $checkoutLineItem): OrderItem
    {
        // Create the order item
        $orderItem = OrderItem::create([
            'organization_id' => $order->organization_id,
            'order_id' => $order->id,
            'price_id' => $checkoutLineItem->price_id,
            'slot_id' => $checkoutLineItem->slot_id,
            'quantity' => $checkoutLineItem->quantity,
            'total_amount' => $checkoutLineItem->total_amount,
            'metadata' => [], // Can be extended to include additional metadata if needed
        ]);

        return $orderItem;
    }
}
