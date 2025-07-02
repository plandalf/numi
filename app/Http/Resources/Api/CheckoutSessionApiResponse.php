<?php

namespace App\Http\Resources\Api;

use App\Models\Checkout\CheckoutSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Dedoc\Scramble\Attributes\SchemaName;

/**
 * @mixin CheckoutSession
 */
#[SchemaName('CheckoutSession')]
class CheckoutSessionApiResponse extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            /**
             * Unique identifier for the checkout session
             * @example "123e4567-e89b-12d3-a456-426614174000"
             */
            'id' => $this->getRouteKey(),
            /**
             * Status of the checkout session
             * @var string
             * @example "started"
             */
            'status' => $this->status,
            /**
             *
             */
            'customer' => new CustomerApiResponse($this->whenLoaded('customer')),
            /**
             * @example "2025-12-31T23:59:59Z"
             */
            'expires_at' => $this->expires_at,
            /**
             * @example "2025-12-31T23:59:59Z"
             */
            'finalized_at' => $this->finalized_at,
            /**
             * Metadata associated with the checkout session
             * @var array<string, mixed>
             * @example {"key": "value"}
             */
            'metadata' => $this->metadata,
            /**
             * Discount Codes applied to the session
             */
            'discounts' => $this->discounts,
            /**
             * Metadata associated with the checkout session
             * @var array<string, mixed>
             * @example {"fieldId": "field-value"}
             */
            'properties' => $this->properties,
            'line_items' => CheckoutLineItemApiResource::collection($this->line_items),
            /**
             * Total Order Amount
             * @var int
             * @example 1200
             */
            'total' => $this->total,
            /**
             * Total amount of taxes applied to the order
             * @var int
             * @example 200
             */
            'taxes' => $this->taxes,
            /**
             * Total amount of incluive taxes applied to the order
             * @var int
             * @example 200
             */
            'inclusive_taxes' => $this->inclusive_taxes,
            /**
             * Subtotal
             * @var int
             * @example 1000
             */
            'subtotal' => $this->subtotal,
            /**
             * Currency of the order
             * @var string
             * @example "USD"
             */
            'currency' => $this->currency,
        ];
    }
}
