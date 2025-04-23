<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
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
            'ulid' => $this->ulid,
            'name' => $this->name,
            'invite_link' => $this->invite_link,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'subscriptions' => $this->whenLoaded('subscriptions', function () {
                return  SubscriptionResource::collection($this->subscriptions);
            }, null),
            'users' => $this->whenLoaded('users', function () {
                return $this->users;
            }, null),
        ];
    }
}
