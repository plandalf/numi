<?php

namespace App\Http\Resources;

use App\Enums\Theme\FontElement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FontResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->value,
            'weights' => $this->getFontWeights(),
            'css_font_family' => $this->getCssFontFamily(),
        ];
    }

    /**
     * Get all available fonts as a collection.
     */
    public static function collection($resource): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        return parent::collection(FontElement::cases());
    }
} 