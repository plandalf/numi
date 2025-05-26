<?php

namespace App\Http\Resources\Checkout;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CheckoutSessionResource extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            'id' => $this->getRouteKey(),
            'status' => $this->status,
            'line_items' => CheckoutItemResource::collection($this->whenLoaded('lineItems')),
            'currency' => $this->currency,
            'total' => $this->total,
            'subtotal' => $this->subtotal,
            'publishable_key' => $this->publishable_key,
            'integration_client' => $this->whenLoaded('integration', function () {
                return $this->integration->type;
            }),
            'current_page' => data_get($this->metadata, 'current_page_id'),
            // 'taxes' => $this->taxes,
            // 'discount' => $this->discount,
        ];
    }
}
