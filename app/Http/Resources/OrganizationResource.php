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
            'description' => $this->description,
            'website_url' => $this->website_url,
            'logo_media_id' => $this->logo_media_id,
            'logo_media' => $this->whenLoaded('logoMedia', function () {
                return [
                    'id' => $this->logo_media_id,
                    'url' => $this->logoMedia->getSignedUrl(),
                    'signed_url' => $this->logoMedia->getSignedUrl(),
                ];
            }),
            'favicon_media_id' => $this->favicon_media_id,
            'favicon_media' => $this->whenLoaded('faviconMedia', function () {
                return [
                    'id' => $this->favicon_media_id,
                    'url' => $this->faviconMedia->getSignedUrl(),
                    'signed_url' => $this->faviconMedia->getSignedUrl(),
                ];
            }),
            'primary_color' => $this->primary_color,
            'social_media' => $this->social_media,
            'invite_link' => $this->invite_link,
            'default_currency' => $this->default_currency,
            'subdomain' => $this->subdomain,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'on_trial' => $this->on_trial,
            'trial_days_left' => $this->trial_days_left,
            'trial_period_expired' => $this->trial_period_expired,
            'checkout_success_url' => $this->checkout_success_url,
            'checkout_cancel_url' => $this->checkout_cancel_url,

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
