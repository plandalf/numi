<?php

namespace App\Http\Resources;

use App\Models\Order\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
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
            'id' => $this->getRouteKey(),
            'order_number' => $this->order_number,
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label() ?? ucfirst($this->status->value),
            ],
            'total_amount' => $this->total_amount,
            'currency' => $this->currency,
            'intent_id' => $this->intent_id,
            'intent_type' => $this->intent_type,
            'payment_id' => $this->payment_id,
            'payment_method_id' => $this->payment_method_id,
            'completed_at' => $this->completed_at,
            'receipt_url' => $this->getReceiptUrl(),

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
            'organization' => $this->whenLoaded('organization', function () {
                return [
                    'id' => $this->organization->id,
                    'name' => $this->organization->name,
                    'subdomain' => $this->organization->subdomain,
                ];
            }),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'checkout_session' => $this->when($this->checkoutSession, function () {
                return [
                    'id' => $this->checkoutSession->id,
                    'status' => $this->checkoutSession->status,
                    'discounts' => $this->checkoutSession->discounts,
                    'properties' => $this->checkoutSession->properties,
                    'payment_method' => $this->when($this->checkoutSession->paymentMethod, function () {
                        $pm = $this->checkoutSession->paymentMethod;
                        return [
                            'id' => $pm->id,
                            'type' => $pm->type,
                            'brand' => $pm->getCardBrandAttribute(),
                            'last4' => $pm->getLast4Attribute(),
                            'exp_month' => $pm->getExpMonthAttribute(),
                            'exp_year' => $pm->getExpYearAttribute(),
                            'billing_details' => $pm->billing_details?->toArray(),
                            'display_name' => $pm->getDisplayNameAttribute(),
                        ];
                    }),
                ];
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
