<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateResource extends JsonResource
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
            'category' => $this->category,
            'view' => $this->view,
            'preview_images' => $this->preview_images,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Load theme using ThemeResource when relationship is loaded
            'theme' => $this->when(
                $this->relationLoaded('theme'),
                fn () => $this->theme ? new ThemeResource($this->theme) : null
            ),

            // Load organization when relationship is loaded
            'organization' => $this->when(
                $this->relationLoaded('organization'),
                fn () => $this->organization ? [
                    'id' => $this->organization->id,
                    'name' => $this->organization->name,
                    'ulid' => $this->organization->ulid,
                ] : null
            ),
        ];
    }
}
