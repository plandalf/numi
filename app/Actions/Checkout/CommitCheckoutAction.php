<?php

namespace App\Actions\Checkout;

use App\Actions\Order\CreateOrderAction;
use App\Actions\Order\CreateOrderItemAction;
use App\Enums\CheckoutSessionStatus;
use App\Models\Checkout\CheckoutSession;

class CommitCheckoutAction
{
    public function __construct(
        private readonly CreateOrderAction $createOrderAction,
        private readonly CreateOrderItemAction $createOrderItemAction
    ) {}


    public function execute(CheckoutSession $checkoutSession): CheckoutSession
    {
        // If the checkout session is already closed, return it
        if ($checkoutSession->status === CheckoutSessionStatus::CLOSED) {
            return $checkoutSession;
        }

        $order = $this->createOrderAction->execute($checkoutSession);

        // Create order items from checkout line items
        foreach ($checkoutSession->lineItems as $lineItem) {
            $this->createOrderItemAction->execute($order, $lineItem);
        }

        $order->updateTotalAmount();

        $checkoutSession->markAsClosed();

        return $checkoutSession;
    }
}
