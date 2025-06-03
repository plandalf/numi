<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HostedPageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'logo_image_id' => $this->logo_image_id,
            'logo_image' => $this->whenLoaded('logoImage', function () {
                return [
                    'id' => $this->logo_image_id,
                    'url' => $this->logoImage->getSignedUrl(),
                ];
            }),
            'background_image_id' => $this->background_image_id,
            'background_image' => $this->whenLoaded('backgroundImage', function () {
                return [
                    'id' => $this->background_image_id,
                    'url' => $this->backgroundImage->getSignedUrl(),
                ];
            }),
            'style' => $this->style,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
