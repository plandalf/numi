<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'current_organization_id' => $this->current_organization_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Only include organization data when loaded
            'current_organization' => $this->whenLoaded('currentOrganization', function () {
                return [
                    'id' => $this->currentOrganization->id,
                    'name' => $this->currentOrganization->name,
                    'ulid' => $this->currentOrganization->ulid,
                ];
            }),
        ];
    }
} 