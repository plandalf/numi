<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
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
            ...parent::toArray($request),
            'id' => $this->getRouteKey(),
            'variants' => $this->variants,
            'product_image' => $this->whenLoaded('productImage', function () {
                return [
                    'id' => $this->product_image_id,
                    'url' => $this->productImage->getSignedUrl(),
                ];
            })
        ];
    }
}
