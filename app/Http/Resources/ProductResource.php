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
            'gateway_product_id' => $this->gateway_product_id,
            'gateway_provider' => $this->gateway_provider,
            'status' => $this->status,
            'description' => $this->description,
            'organization_id' => $this->organization_id,
            'integration_id' => $this->integration_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),

            // Conditionally load prices if the relationship is loaded
            'prices' => PriceResource::collection($this->whenLoaded('prices')),

            // Include integration data if loaded
            'integration' => $this->whenLoaded('integration', function() {
                return [
                    'id' => $this->integration->id,
                    'name' => $this->integration->name,
                    'type' => $this->integration->type,
                ];
            }),
        ];
    }
}
