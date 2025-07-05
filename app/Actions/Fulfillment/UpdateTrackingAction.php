<?php

namespace App\Actions\Fulfillment;

use App\Models\Order\OrderItem;
use Illuminate\Support\Facades\Log;

class UpdateTrackingAction
{
    /**
     * Update tracking information for an order item.
     */
    public function execute(OrderItem $orderItem, array $data): OrderItem
    {
        if (isset($data['tracking_number'])) {
            $orderItem->tracking_number = $data['tracking_number'];
        }
        
        if (isset($data['tracking_url'])) {
            $orderItem->tracking_url = $data['tracking_url'];
        }
        
        if (isset($data['expected_delivery_date'])) {
            $orderItem->expected_delivery_date = $data['expected_delivery_date'];
        }
        
        if (isset($data['delivered_at'])) {
            $orderItem->delivered_at = $data['delivered_at'];
        }
        
        if (isset($data['notes'])) {
            $orderItem->fulfillment_notes = $data['notes'];
        }
        
        $orderItem->save();
        
        Log::info('Order item tracking updated', [
            'order_item_id' => $orderItem->id,
            'tracking_number' => $orderItem->tracking_number,
            'updated_by' => auth()->id(),
        ]);
        
        return $orderItem;
    }
} 