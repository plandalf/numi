<?php

namespace App\Http\Resources\Api;

use App\Models\Order\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Dedoc\Scramble\Attributes\SchemaName;

/**
 * @mixin Order
 */
#[SchemaName('Order')]
class OrderApiResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getRouteKey(),
            'order_number' => $this->order_number,
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label() ?? ucfirst($this->status->value),
            ],
            'total_amount' => $this->total_amount,
            'currency' => $this->currency,
            'completed_at' => $this->completed_at,

            // Simplified customer info
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                    'email' => $this->customer->email,
                ];
            }),

            // Items for provisioning
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'quantity' => $item->quantity,
                        'metadata' => $item->metadata,
                        
                        // Product lookup key for provisioning
                        'product' => $item->relationLoaded('price') && 
                            $item->price && 
                            $item->price->relationLoaded('product') && 
                            $item->price->product ? 
                            $item->price->product->lookup_key : null,
                        // Fulfillment info
                        'fulfillment_status' => $item->fulfillment_status,
                        'delivery_method' => $item->delivery_method,
                        'quantity_fulfilled' => $item->quantity_fulfilled,
                        'quantity_remaining' => $item->quantity_remaining,
                        'external_platform_data' => $item->external_platform_data,
                        'fulfillment_data' => $item->fulfillment_data,
                        'fulfilled_at' => $item->fulfilled_at,

                    ];
                })->values();
            }),
        ];
    }
}