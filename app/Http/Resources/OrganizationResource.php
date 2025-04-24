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
            'on_trial' => $this->on_trial,
            'trial_days_left' => $this->trial_days_left,
            'trial_period_expired' => $this->trial_period_expired,

            $this->when(
                $this->resource->relationLoaded('subscriptions'),
                function () {
                    return $this->merge([
                        'subscribed' => $this->whenLoaded('subscriptions', function () {
                            return $this->subscribed;
                        }, false),
                        'subscriptions' => SubscriptionResource::collection(
                            $this->subscriptions
                        ),
                    ]);
                },
            ),
            'users' => $this->whenLoaded('users', function () {
                return $this->users;
            }, null),
        ];
    }
}
