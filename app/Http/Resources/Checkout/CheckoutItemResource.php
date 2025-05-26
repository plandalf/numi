<?php

namespace App\Http\Resources\Checkout;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CheckoutItemResource extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            'id' => $this->id,
            'offer_item' => $this->offerItem->name,
            'name' => $this->offerItem->name,
            'quantity' => $this->quantity,
            'subtotal' => $this->subtotal,
            // 'taxes' => $this->price->calculateTaxes()->getAmount(),
            'total' => $this->total,
            'image' => $this->when(
                $this->resource->relationLoaded('price') && $this->price->relationLoaded('product'),
                function () {
                    return $this->price->product->image;
                },
            ),
            // 'discount' => $this->price->calculateDiscount()->getAmount(),
        ];
    }
}
