<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'price' => new PriceResource($this->whenLoaded('defaultPrice')),
            'product' => $this->when($this->relationLoaded('defaultPrice') &&
                $this->defaultPrice?->relationLoaded('product'), function () {
                return new ProductResource($this->defaultPrice->product);
            }),
        ]);
    }
}
