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
            'metadata' => $this->metadata,
            'line_items' => CheckoutItemResource::collection($this->whenLoaded('lineItems')),
            'currency' => $this->currency,
            'total' => $this->total,
            'subtotal' => $this->subtotal,
            'is_test_mode' => $this->test_mode && ! $request->boolean('hide_test'),
            'publishable_key' => $this->publishable_key,
            'integration_client' => $this->integration?->type?->value,
            'client_secret' => $this->client_secret,
            'intent_type' => $this->intent_type,
            'intent' => $this->intent,
            'subscription' => $this->subscription,
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
                    'reference_id' => $this->customer->reference_id,
                    'email' => $this->customer->email,
                    'name' => $this->customer->name,
                ];
            }),
            'preview' => $this->whenLoaded('lineItems', function () {
                try {
                    $base = $this->lineItems->first(function ($li) {
                        $type = $li->price?->type;
                        $value = is_string($type) ? $type : ($type?->value ?? null);
                        return $li->price && $value !== 'one_time';
                    });

                    if (! $base) {
                        return [
                            'enabled' => false,
                            'reason' => 'No recurring line item',
                        ];
                    }

                    $trialDays = $base->price?->trial_period_days;
                    $trialEnd = (is_numeric($trialDays) && (int) $trialDays > 0)
                        ? now()->addDays((int) $trialDays)->toISOString()
                        : null;

                    $amount = (int) ($base->total ?? 0);
                    $interval = $base->price?->renew_interval;
                    $currency = strtolower((string) $this->currency);

                    return [
                        'enabled' => true,
                        'scenario' => 'new_subscription',
                        'effective' => [
                            'strategy' => $trialEnd ? 'at_date' : 'immediate',
                            'at' => $trialEnd ?? now()->toISOString(),
                            'is_future' => (bool) $trialEnd,
                        ],
                        'current' => null,
                        'proposed' => [
                            'trial_end' => $trialEnd,
                            'base_item' => [
                                'amount' => $amount,
                                'interval' => $interval,
                                'quantity' => (int) ($base->quantity ?? 1),
                                'product' => [
                                    'id' => $base->price?->product?->gateway_product_id,
                                    'name' => $base->price?->product?->name,
                                ],
                            ],
                        ],
                        'delta' => [
                            'proration_subtotal' => 0,
                            'total_due_at_effective' => 0,
                            'currency' => $currency,
                            'can_prorate' => false,
                        ],
                        'invoice_preview' => [
                            'next_period' => [
                                'amount' => $amount,
                                'period' => [
                                    'interval' => $interval,
                                ],
                                'currency' => $currency,
                            ],
                        ],
                    ];
                } catch (\Throwable) {
                    return [
                        'enabled' => false,
                        'reason' => 'Preview computation failed',
                    ];
                }
            }),
            // derive price trial if any recurring item has it
            'trial_period_days' => $this->when(true, function () {
                $items = $this->lineItems;
                foreach (($items ?? []) as $li) {
                    try {
                        if (($li->price?->type?->value ?? $li->price?->type) !== 'one_time') {
                            $days = $li->price?->trial_period_days;
                            if (is_numeric($days) && (int) $days > 0) {
                                return (int) $days;
                            }
                        }
                    } catch (\Throwable) {
                    }
                }

                return null;
            }),
            'order' => $this->whenLoaded('order', function () {
                return new OrderResource($this->order);
            }, null),
        ];
    }
}
