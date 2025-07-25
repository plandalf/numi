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
            'prices' => PriceResource::collection($this->whenLoaded('prices', function () {
                return $this->prices->map(function ($price) {
                    $offerPrice = $this->offerPrices->firstWhere('price_id', $price->id);
                    $price->name = $offerPrice?->name ?? $price->name;
                    return $price;
                });
            })),
        ]);
    }
}
