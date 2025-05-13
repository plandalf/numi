<?php

namespace App\Http\Resources;

use App\Models\Store\OfferItem;
use App\Models\Theme;
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
            'id' => $this->getRouteKey(),
            'name' => $this->name,
            'description' => $this->description,
            'product_image_id' => $this->product_image_id,
            'product_image' => $this->whenLoaded('productImage', function () {
                return [
                    'id' => $this->product_image_id,
                    'url' => $this->productImage->getSignedUrl(),
                ];
            }),
            'screenshot' => $this->whenLoaded('screenshot', function () {
                return [
                    'url' => url($this->screenshot->path),
                ];
            }, null),
            'status' => $this->status,
            'organization_id' => $this->organization_id,
            'view' => $this->view,
            'properties' => $this->properties,
            'offer_items' => OfferItemResource::collection($this->whenLoaded('offerItems')),
            'theme' => new ThemeResource($this?->theme ?? new Theme),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'products' => OfferProductResource::collection($this->whenLoaded('offerProducts')),
        ];
    }
}
