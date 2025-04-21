<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'lookup_key' => $this->lookup_key,
            // 'description' => $this->description,
            // 'media_id' => $this->media_id,
            // 'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Conditionally load prices if the relationship is loaded
            'prices' => PriceResource::collection($this->whenLoaded('prices')),

            'integration_id' => $this->integration_id,

            // Optionally load media if needed (assuming MediaResource exists or is simple)
            // 'media' => new MediaResource($this->whenLoaded('media')),
        ];
    }
}
