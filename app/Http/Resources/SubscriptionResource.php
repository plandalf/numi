<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
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
            'product_name' => $this->product_name,
            'stripe_status' => $this->stripe_status,
            'type' => $this->type,
            'quantity' => $this->quantity,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'on_trial' => $this->onTrial(),
            'trial_days_left' => $this->trial_days_left,
            'is_free_plan' => $this->is_free_plan,
        ];
    }
}
