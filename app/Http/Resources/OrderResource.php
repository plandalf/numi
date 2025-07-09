<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'uuid' => $this->uuid,
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label() ?? ucfirst($this->status->value),
            ],
            'currency' => $this->currency,
            'total_amount' => $this->total_amount,
            'completed_at' => $this->completed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            
            // Fulfillment information
            'fulfillment_method' => [
                'value' => $this->fulfillment_method?->value,
                'label' => $this->fulfillment_method?->label(),
            ],
            'fulfillment_config' => $this->fulfillment_config,
            'fulfillment_notified' => $this->fulfillment_notified,
            'fulfillment_notified_at' => $this->fulfillment_notified_at?->toISOString(),
            
            // Fulfillment statistics
            'fulfillment_summary' => [
                'total_items' => $this->whenLoaded('items', function () {
                    return $this->items->count();
                }),
                'fulfilled_items' => $this->whenLoaded('items', function () {
                    return $this->items->where('fulfillment_status', 'fulfilled')->count();
                }),
                'pending_items' => $this->whenLoaded('items', function () {
                    return $this->items->where('fulfillment_status', 'pending')->count();
                }),
                'unprovisionable_items' => $this->whenLoaded('items', function () {
                    return $this->items->where('fulfillment_status', 'unprovisionable')->count();
                }),
            ],
            
            'customer' => $this->when($this->customer, function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                    'email' => $this->customer->email,
                ];
            }),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'checkout_session' => $this->when($this->checkoutSession, function () {
                try {
                    \Log::info('Accessing checkout session in OrderResource', [
                        'order_id' => $this->id,
                        'has_checkout_session_relationship' => $this->relationLoaded('checkoutSession') ? 'yes' : 'no',
                        'checkout_session_id' => $this->checkout_session_id ?? 'none'
                    ]);
                    $session = $this->checkoutSession;
                    $paymentMethod = $session->paymentMethod;
                    return [
                        'id' => $session->id,
                        'status' => $session->status,
                        'discounts' => $session->discounts,
                        'properties' => $session->properties,
                        'payment_method' => $paymentMethod ? [
                            'type' => $paymentMethod->type,
                            'brand' => $paymentMethod->brand,
                            'last4' => $paymentMethod->last4,
                            'exp_month' => $paymentMethod->exp_month,
                            'exp_year' => $paymentMethod->exp_year,
                        ] : null,
                    ];
                } catch (\Exception $e) {
                    // Log the error and return null to prevent crashes
                    \Log::error('Failed to access checkout session in OrderResource', [
                        'order_id' => $this->id,
                        'checkout_session_id' => $this->checkout_session_id,
                        'has_checkout_session_relationship' => $this->relationLoaded('checkoutSession') ? 'yes' : 'no',
                        'error' => $e->getMessage(),
                        'stack_trace' => $e->getTraceAsString()
                    ]);
                    return null;
                }
            }),
            'events' => $this->whenLoaded('events', function () {
                return $this->events->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'type' => $event->type,
                        'description' => $event->description,
                        'metadata' => $event->metadata,
                        'created_at' => $event->created_at->toISOString(),
                        'user' => $event->user ? [
                            'id' => $event->user->id,
                            'name' => $event->user->name,
                            'email' => $event->user->email,
                        ] : null,
                    ];
                });
            }),
        ];
    }
}
