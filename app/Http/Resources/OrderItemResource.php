<?php

namespace App\Http\Resources;

use App\Models\Order\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin OrderItem
 */
class OrderItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'price_id' => $this->price_id,
            'offer_item_id' => $this->offer_item_id,
            'quantity' => $this->quantity,
            'total_amount' => $this->total_amount,
            'metadata' => $this->metadata,

            // Fulfillment data
            'fulfillment_status' => $this->fulfillment_status,
            'delivery_method' => $this->delivery_method,
            'quantity_fulfilled' => $this->quantity_fulfilled,
            'quantity_remaining' => $this->quantity_remaining,
            'fulfillment_progress' => $this->getFulfillmentProgressPercentage(),
            'fulfillment_data' => $this->fulfillment_data,
            'delivery_assets' => $this->delivery_assets,
            'tracking_number' => $this->tracking_number,
            'tracking_url' => $this->tracking_url,
            'expected_delivery_date' => $this->expected_delivery_date?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'fulfilled_at' => $this->fulfilled_at?->toISOString(),
            'fulfillment_notes' => $this->fulfillment_notes,
            'unprovisionable_reason' => $this->unprovisionable_reason,
            'external_platform_data' => $this->external_platform_data,

            // Helper flags
            'is_fully_fulfilled' => $this->isFullyFulfilled(),
            'is_partially_fulfilled' => $this->isPartiallyFulfilled(),
            'is_unfulfilled' => $this->isUnfulfilled(),

            // Relationships
            'price' => $this->whenLoaded('price'),
            'offer_item' => $this->whenLoaded('offerItem'),
            'fulfilled_by' => $this->whenLoaded('fulfilledBy', function () {
                return new UserResource($this->fulfilledBy);
            }),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
