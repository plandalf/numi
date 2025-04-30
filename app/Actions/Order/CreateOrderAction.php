<?php

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;

class CreateOrderAction
{
    /**
     * Create a new order from a checkout session.
     */
    public function __invoke(CheckoutSession $checkoutSession): Order
    {
        // Use updateOrCreate to handle the unique constraint
        $order = Order::updateOrCreate(
            [
                'organization_id' => $checkoutSession->organization_id,
                'checkout_session_id' => $checkoutSession->id,
            ],
            [
                'status' => OrderStatus::PENDING,
                'currency' => 'USD',
            ]
        );

        return $order;
    }
}
