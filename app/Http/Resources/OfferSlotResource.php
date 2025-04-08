<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferSlotResource extends JsonResource
{
    public function toArray(Request $request)
    {
        // just lookup key but its dependent?
        return [
            'id' => $this->getRouteKey(),
            'key' => $this->key,
            'name' => $this->name,
            'is_required' => $this->is_required,
            'sort_order' => $this->sort_order,
            'default_price_id' => $this->default_price_id,
            'default_price' => $this->whenLoaded('default_price', function () {
                return new PriceResource($this->default_price);
            }, null),
        ];
    }
}
