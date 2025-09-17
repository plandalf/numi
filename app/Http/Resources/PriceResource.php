<?php

namespace App\Http\Resources;

use App\Models\Catalog\Price;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Money\Money;

/**
 * @mixin Price
 */
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
            'pricing_model' => $this->type,
            'amount' => $this->getAmount(),
            'currency' => $this->currency,
            'properties' => $this->properties,
            'name' => $this->name,
            'metadata' => $this->metadata,
            'lookup_key' => $this->lookup_key,
            'renew_interval' => $this->renew_interval,
            'billing_anchor' => $this->billing_anchor,
            'recurring_interval_count' => $this->recurring_interval_count,
            'trial_period_days' => $this->trial_period_days,
            'cancel_after_cycles' => $this->cancel_after_cycles,
            'gateway_provider' => $this->gateway_provider ?? 'plandalf',
            'gateway_price_id' => $this->gateway_price_id,
            'is_active' => $this->is_active,
            'archived_at' => $this->archived_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }

    /**
     * Get the amount value safely
     */
    private function getAmount(): mixed
    {
        if (method_exists($this->resource, 'calculateAmount')) {
            return $this->resource->calculateAmount()->getAmount();
        }

        return $this->amount instanceof Money ? $this->amount->getAmount() : (int)($this->amount ?? 0);
    }
}
