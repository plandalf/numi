<?php

namespace App\Actions\Fulfillment;

use App\Enums\FulfillmentStatus;
use App\Models\Order\OrderItem;
use Illuminate\Support\Facades\Log;

class MarkUnprovisionableAction
{
    /**
     * Mark an order item as unprovisionable.
     */
    public function execute(OrderItem $orderItem, string $reason, array $data = []): OrderItem
    {
        $orderItem->fulfillment_status = FulfillmentStatus::UNPROVISIONABLE;
        $orderItem->unprovisionable_reason = $reason;
        $orderItem->fulfilled_by_user_id = auth()->id();
        
        if (isset($data['notes'])) {
            $orderItem->fulfillment_notes = $data['notes'];
        }
        
        $orderItem->save();
        
        Log::info('Order item marked as unprovisionable', [
            'order_item_id' => $orderItem->id,
            'reason' => $reason,
            'marked_by' => auth()->id(),
        ]);
        
        return $orderItem;
    }
} 