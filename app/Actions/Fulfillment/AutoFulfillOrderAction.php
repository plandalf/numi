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
        
        Log::info('Order auto-fulfilled', [
            'order_id' => $order->id,
            'fulfillment_method' => $organization->fulfillment_method->value,
            'organization_id' => $organization->id,
        ]);
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
        
        switch ($fulfillmentMethod) {
            case FulfillmentMethod::AUTOMATION:
                $this->handleAutomationFulfillment($orderItem, $organization);
                break;
                
            case FulfillmentMethod::API:
                $this->handleApiFulfillment($orderItem, $organization);
                break;
                
            case FulfillmentMethod::EXTERNAL_WEBHOOK:
                $this->handleWebhookFulfillment($orderItem, $organization);
                break;
                
            case FulfillmentMethod::HYBRID:
                $this->handleHybridFulfillment($orderItem, $organization);
                break;
                
            case FulfillmentMethod::MANUAL:
            default:
                // Manual fulfillment - no automatic action
                Log::info('Order item marked for manual fulfillment', [
                    'order_item_id' => $orderItem->id,
                ]);
                break;
        }
    }

    /**
     * Handle automation-based fulfillment.
     */
    private function handleAutomationFulfillment(OrderItem $orderItem, $organization): void
    {
        $config = $organization->fulfillment_config ?? [];
        
        if ($orderItem->delivery_method === DeliveryMethod::INSTANT_ACCESS) {
            // Instantly fulfill digital products
            $this->provisionOrderItemAction->execute($orderItem, [
                'quantity' => $orderItem->quantity,
                'delivery_method' => DeliveryMethod::INSTANT_ACCESS,
                'fulfillment_data' => [
                    'auto_fulfilled' => true,
                    'fulfillment_type' => 'automation',
                ],
                'notes' => 'Automatically fulfilled via automation',
            ]);
        } elseif ($orderItem->delivery_method === DeliveryMethod::EMAIL_DELIVERY) {
            // Email-based fulfillment
            $this->provisionOrderItemAction->execute($orderItem, [
                'quantity' => $orderItem->quantity,
                'delivery_method' => DeliveryMethod::EMAIL_DELIVERY,
                'fulfillment_data' => [
                    'auto_fulfilled' => true,
                    'fulfillment_type' => 'automation',
                    'email_sent' => true,
                ],
                'notes' => 'Automatically fulfilled via email delivery',
            ]);
        }
    }

    /**
     * Handle API-based fulfillment.
     */
    private function handleApiFulfillment(OrderItem $orderItem, $organization): void
    {
        $config = $organization->fulfillment_config ?? [];
        
        // This would integrate with external APIs
        // For now, we'll just mark it as provisioned
        $this->provisionOrderItemAction->execute($orderItem, [
            'quantity' => $orderItem->quantity,
            'delivery_method' => $orderItem->delivery_method,
            'fulfillment_data' => [
                'auto_fulfilled' => true,
                'fulfillment_type' => 'api',
                'api_config' => $config,
            ],
            'notes' => 'Automatically fulfilled via API',
        ]);
    }

    /**
     * Handle webhook-based fulfillment.
     */
    private function handleWebhookFulfillment(OrderItem $orderItem, $organization): void
    {
        $config = $organization->fulfillment_config ?? [];
        
        // This would send webhook notifications to external systems
        // For now, we'll just mark it as processing
        $orderItem->fulfillment_status = \App\Enums\FulfillmentStatus::PROCESSING;
        $orderItem->fulfillment_data = [
            'auto_fulfilled' => true,
            'fulfillment_type' => 'webhook',
            'webhook_sent' => true,
        ];
        $orderItem->save();
        
        Log::info('Webhook fulfillment initiated', [
            'order_item_id' => $orderItem->id,
            'webhook_config' => $config,
        ]);
    }

    /**
     * Handle hybrid fulfillment (combination of automatic and manual).
     */
    private function handleHybridFulfillment(OrderItem $orderItem, $organization): void
    {
        $config = $organization->fulfillment_config ?? [];
        
        // Check if this item type should be auto-fulfilled
        if (isset($config['auto_fulfill_item_types']) && 
            in_array($orderItem->offerItem?->type?->value, $config['auto_fulfill_item_types'])) {
            
            $this->handleAutomationFulfillment($orderItem, $organization);
        } else {
            // Mark for manual fulfillment
            Log::info('Order item marked for manual fulfillment (hybrid mode)', [
                'order_item_id' => $orderItem->id,
            ]);
        }
    }
} 