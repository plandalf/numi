<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\SlotResource;

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
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'product_image_id' => $this->product_image_id,
            'product_image' => $this->whenLoaded('productImage', function () {
                return [
                    'id' => $this->product_image_id,
                    'url' => $this->productImage->getSignedUrl(),
                ];
            }),
            'status' => $this->status,
            'organization_id' => $this->organization_id,
            'view' => $this->view,
            'properties' => $this->properties,
            
            'slots' => SlotResource::collection($this->whenLoaded('slots')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
