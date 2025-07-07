<?php

namespace App\Actions\Fulfillment;

use App\Enums\FulfillmentMethod;
use App\Enums\DeliveryMethod;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use Illuminate\Support\Facades\Log;

class AutoFulfillOrderAction
{
    public function __construct(
        private ProvisionOrderItemAction $provisionOrderItemAction
    ) {}

    /**
     * Auto-fulfill an order based on organization settings.
     */
    public function execute(Order $order): void
    {
        $organization = $order->organization;

        if (!$organization->auto_fulfill_orders) {
            return;
        }

        // Set the order's fulfillment method from the organization
        $order->fulfillment_method = $organization->fulfillment_method;
        $order->fulfillment_config = $organization->fulfillment_config;
        $order->save();

        foreach ($order->items as $orderItem) {
            $this->fulfillOrderItem($orderItem, $organization);
        }
    }

    /**
     * Fulfill an individual order item based on organization settings.
     */
    private function fulfillOrderItem(OrderItem $orderItem, $organization): void
    {
        $fulfillmentMethod = $organization->fulfillment_method;
        $deliveryMethod = $organization->default_delivery_method;

        // Set the delivery method on the order item
        $orderItem->delivery_method = $deliveryMethod;
        $orderItem->save();

        $config = $organization->fulfillment_config ?? [];

        // This would integrate with external APIs
        // For now, we'll just mark it as provisioned
        $this->provisionOrderItemAction->execute($orderItem, [
            'quantity' => $orderItem->quantity,
            'delivery_method' => $orderItem->delivery_method,
            'fulfillment_data' => [
                'auto_fulfilled' => true,
                'fulfillment_type' => $fulfillmentMethod->value,
                'api_config' => $config,
            ],
            'notes' => null,
        ]);
    }
}
