<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceResource extends JsonResource
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
            'product_id' => $this->product_id,
            'organization_id' => $this->organization_id,
            'parent_list_price_id' => $this->parent_list_price_id,
            'scope' => $this->scope,
            'type' => $this->type,
            'amount' => $this->calculateAmount()->getAmount(),
            'currency' => $this->currency,
            'properties' => $this->properties,
            'name' => $this->name,
            'lookup_key' => $this->lookup_key,
            'renew_interval' => $this->renew_interval,
            'billing_anchor' => $this->billing_anchor,
            'recurring_interval_count' => $this->recurring_interval_count,
            'cancel_after_cycles' => $this->cancel_after_cycles,
            'gateway_provider' => $this->gateway_provider,
            'gateway_price_id' => $this->gateway_price_id,
            'is_active' => $this->is_active,
            'archived_at' => $this->archived_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
}
