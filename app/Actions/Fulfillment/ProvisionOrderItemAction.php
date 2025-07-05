<?php

namespace App\Actions\Fulfillment;

use App\Enums\FulfillmentStatus;
use App\Models\Order\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProvisionOrderItemAction
{
    /**
     * Update fulfillment for an order item with comprehensive data.
     */
    public function execute(OrderItem $orderItem, array $data): OrderItem
    {
        return DB::transaction(function () use ($orderItem, $data) {
            // Validate quantity
            $quantityFulfilled = $data['quantity_fulfilled'] ?? $orderItem->quantity_fulfilled;
            if ($quantityFulfilled > $orderItem->quantity) {
                throw new \InvalidArgumentException("Cannot fulfill more than {$orderItem->quantity} items");
            }

            // Update fulfillment status and quantities
            $orderItem->fulfillment_status = $data['fulfillment_status'];
            $orderItem->quantity_fulfilled = $quantityFulfilled;
            $orderItem->quantity_remaining = $orderItem->quantity - $quantityFulfilled;
            
            // Set fulfillment notes
            if (isset($data['notes'])) {
                $orderItem->fulfillment_notes = $data['notes'];
            }
            
            // Set metadata
            if (isset($data['metadata'])) {
                $orderItem->fulfillment_data = array_merge(
                    $orderItem->fulfillment_data ?? [],
                    $data['metadata']
                );
            }
            
            // Set tracking information
            if (isset($data['tracking_number'])) {
                $orderItem->tracking_number = $data['tracking_number'];
            }
            
            if (isset($data['tracking_url'])) {
                $orderItem->tracking_url = $data['tracking_url'];
            }
            
            // Set unprovisionable reason
            if (isset($data['unprovisionable_reason'])) {
                $orderItem->unprovisionable_reason = $data['unprovisionable_reason'];
            }
            
            // Set delivery assets
            if (isset($data['delivery_assets'])) {
                $orderItem->delivery_assets = $data['delivery_assets'];
            }
            
            // Set fulfillment timestamp and user for fulfilled/partially fulfilled items
            if ($data['fulfillment_status'] === 'fulfilled' || $data['fulfillment_status'] === 'partially_fulfilled') {
                $orderItem->fulfilled_at = now();
                $orderItem->fulfilled_by_user_id = auth()->id();
            }
            
            $orderItem->save();
            
            Log::info('Order item fulfillment updated', [
                'order_item_id' => $orderItem->id,
                'fulfillment_status' => $data['fulfillment_status'],
                'quantity_fulfilled' => $quantityFulfilled,
                'fulfilled_by' => auth()->id(),
            ]);
            
            return $orderItem;
        });
    }
} 