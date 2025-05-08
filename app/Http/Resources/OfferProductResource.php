<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferProductResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'store_offer_product_id' => $this->id,
            $this->when($this->relationLoaded('product'), function () {
                return $this->merge(new ProductResource($this->product));
            }),
            'prices' => PriceResource::collection($this->whenLoaded('prices')),
        ];
    }
}
