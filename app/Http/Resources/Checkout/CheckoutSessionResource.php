<?php

namespace App\Http\Resources\Checkout;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

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
            'publishable_key' => $this->publishable_key,
            'integration_client' => $this->integration?->type?->value,
            'current_page' => data_get($this->metadata, 'current_page_id'),
            'discounts' => $this->discounts,
            'taxes' => $this->taxes,
            // 'exclusive_taxes' => $this->exclusive_taxes,
            'inclusive_taxes' => $this->inclusive_taxes,
            // 'discount' => $this->discount,
            'enabled_payment_methods' => $this->enabled_payment_methods,
            'frontend_payment_methods' => $this->frontend_payment_methods,
            'intent_mode' => $this->intent_mode,
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'email' => $this->customer->email,
                    'name' => $this->customer->name,
                ];
            }),
            'order_status_url' => $this->when($this->order, function () {
                try {
                    \Log::info('Generating order status URL', [
                        'order_id' => $this->order->id,
                        'order_has_checkout_session' => $this->order->relationLoaded('checkoutSession') ? 'yes' : 'no',
                        'order_checkout_session_id' => $this->order->checkout_session_id ?? 'none'
                    ]);
                    return URL::signedRoute('order-status.show', ['order' => $this->order], now()->addDays(30));
                } catch (\Exception $e) {
                    \Log::error('Failed to generate order status URL', [
                        'order_id' => $this->order->id ?? 'unknown',
                        'error' => $e->getMessage(),
                        'stack_trace' => $e->getTraceAsString()
                    ]);
                    return null;
                }
            }),
            'error_message' => $this->error_message,
            'error_code' => $this->error_code,
            'error_details' => $this->error_details,
            'failed_at' => $this->failed_at,
        ];
    }
}
