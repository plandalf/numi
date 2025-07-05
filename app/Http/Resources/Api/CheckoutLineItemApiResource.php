<?php

namespace App\Http\Resources\Api;

use App\Models\Checkout\CheckoutLineItem;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property CheckoutLineItem $resource
 * @mixin CheckoutLineItem
 */
#[SchemaName('CheckoutLineItem')]
class CheckoutLineItemApiResource extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            'id' => $this->getRouteKey(),
            'quantity' => $this->quantity,
        ];
    }
}
