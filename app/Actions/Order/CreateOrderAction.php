<?php

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use Illuminate\Support\Str;

class CreateOrderAction
{
    /**
     * Create a new order from a checkout session.
     *
     * @param CheckoutSession $checkoutSession
     * @return Order
     */
    public function execute(CheckoutSession $checkoutSession): Order
    {
        // Use updateOrCreate to handle the unique constraint
        $order = Order::updateOrCreate(
            [
                'organization_id' => $checkoutSession->organization_id,
                'checkout_session_id' => $checkoutSession->id,
            ],
            [
                'status' => OrderStatus::PENDING,
                'total_amount' => 0,
                'currency' => 'USD',
            ]
        );

        return $order;
    }
}
