<?php

namespace App\Actions\Checkout;

use App\Actions\Order\CreateOrderAction;
use App\Actions\Order\CreateOrderItemAction;
use App\Actions\Order\ProcessOrder;
use App\Enums\CheckoutSessionStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;

class CommitCheckoutAction
{
    public function __construct(
        private readonly CreateOrderAction $createOrderAction,
        private readonly CreateOrderItemAction $createOrderItemAction,
        private readonly ProcessOrder $processOrder
    ) {}


    public function execute(CheckoutSession $checkoutSession): Order
    {
        // If the checkout session is already closed, return it
        if ($checkoutSession->status === CheckoutSessionStatus::CLOSED) {
            return $checkoutSession->order;
        }

        $order = ($this->createOrderAction)($checkoutSession);

        // Create order items from checkout line items
        foreach ($checkoutSession->lineItems as $lineItem) {
            ($this->createOrderItemAction)($order, $lineItem);
        }

        return ($this->processOrder)($order, $checkoutSession);
    }
}
