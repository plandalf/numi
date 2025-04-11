<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThemeResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $properties = $this->getThemeProperties()->toArray();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'color' => $properties['color'] ?? [],
            'typography' => $properties['typography'] ?? [],
            'components' => $properties['components'] ?? [],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
