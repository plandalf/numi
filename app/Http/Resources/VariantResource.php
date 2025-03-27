<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VariantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getRouteKey(),
            ...parent::toArray($request),
            'media' => $this->whenLoaded('media', function () {
                return [
                    'id' => $this->media->getRouteKey(),
                    'url' => $this->media->getSignedUrl(),
                ];
            }),
        ];
    }
}
