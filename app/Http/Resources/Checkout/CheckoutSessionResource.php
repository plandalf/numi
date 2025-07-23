<?php

namespace App\Http\Resources\Checkout;

use App\Http\Resources\OrderResource;
use App\Models\Checkout\CheckoutSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CheckoutSession
 */
class CheckoutSessionResource extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            'id' => $this->getRouteKey(),
            'status' => $this->status,
            'properties' => $this->properties,
            'line_items' => CheckoutItemResource::collection($this->whenLoaded('lineItems')),
            'currency' => $this->currency,
            'total' => $this->total,
            'subtotal' => $this->subtotal,
            'is_test_mode' => $this->test_mode,
            'publishable_key' => $this->publishable_key,
            'integration_client' => $this->integration?->type?->value,
            'client_secret' => $this->client_secret,
            'intent_type' => $this->intent_type,
            'intent_mode' => $this->intent_mode, // Computed from line items
            'has_subscription_items' => $this->has_subscription_items, // Computed from line items
            'has_onetime_items' => $this->has_onetime_items, // Computed from line items
            'has_mixed_cart' => $this->has_mixed_cart, // Computed from line items
            'payment_confirmed_at' => $this->payment_confirmed_at,
            'payment_method_locked' => $this->payment_method_locked,
            'return_url' => $this->return_url,
            'enabled_payment_methods' => $this->enabled_payment_methods,
            'intent_state' => $this->hasActiveIntent() ? $this->getIntentState() : null,
            'current_page' => data_get($this->metadata, 'current_page_id'),
            'selected_payment_method' => data_get($this->metadata, 'selected_payment_method'),
            'discounts' => $this->discounts,
            'taxes' => $this->taxes,
            'inclusive_taxes' => $this->inclusive_taxes,
            'payment_method' => $this->whenLoaded('paymentMethod', function () {
                return [
                    'id' => $this->paymentMethod->id,
                    'billing_details' => $this->paymentMethod->billing_details,
                    'type' => $this->paymentMethod->type,
                    'properties' => $this->paymentMethod->properties,
                ];
            }),
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'email' => $this->customer->email,
                    'name' => $this->customer->name,
                ];
            }),
            'order' => $this->whenLoaded('order', function () {
                return new OrderResource($this->order);
            }, null),
        ];
    }
}
