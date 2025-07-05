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
            'default_currency' => $this->default_currency,
            'subdomain' => $this->subdomain,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'on_trial' => $this->on_trial,
            'trial_days_left' => $this->trial_days_left,
            'trial_period_expired' => $this->trial_period_expired,
            'checkout_success_url' => $this->checkout_success_url,
            'checkout_cancel_url' => $this->checkout_cancel_url,
            'fulfillment_method' => $this->fulfillment_method?->value,
            'default_delivery_method' => $this->default_delivery_method?->value,
            'fulfillment_notification_email' => $this->fulfillment_notification_email,
            'auto_fulfill_orders' => $this->auto_fulfill_orders,
            'fulfillment_config' => $this->fulfillment_config,
            'external_platform_config' => $this->external_platform_config,

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
