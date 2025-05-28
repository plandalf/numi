<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'uuid' => $this->uuid,
            'status' => $this->status->value,
            'currency' => $this->currency,
            'total_amount' => $this->total_amount,
            'completed_at' => $this->completed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'customer' => $this->when($this->customer, function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                    'email' => $this->customer->email,
                ];
            }),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'checkout_session' => $this->when($this->checkoutSession, function () {
                return [
                    'id' => $this->checkoutSession->id,
                    'status' => $this->checkoutSession->status,
                    'discounts' => $this->checkoutSession->discounts,
                ];
            }),
        ];
    }
}
