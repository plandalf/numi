<?php

namespace App\Http\Resources\Checkout;

use App\Http\Resources\PriceResource;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CheckoutItemResource extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            'id' => $this->id,
            'offer_item' => $this->offerItem?->name,
            'name' => $this->offerItem?->name,
            'quantity' => $this->quantity,
            'subtotal' => $this->subtotal,
            'currency' => $this->currency,
            'is_highlighted' => $this->offerItem?->is_highlighted,
            // 'taxes' => $this->price->calculateTaxes()->getAmount(),
            'total' => $this->total,
            'product' => $this->when(
                $this->resource->relationLoaded('price') && $this->price->relationLoaded('product'),
                function () {
                    return new ProductResource($this->price->product);
                },
            ),
            // 'price' => new PriceResource($this->whenLoaded('price')),
            'price' => $this->when(
                $this->resource->relationLoaded('offerItem') &&
                $this->offerItem != null &&
                $this->offerItem->relationLoaded('offerPrices'),
                function () {
                    $offerPrice = $this->offerItem->offerPrices->firstWhere('price_id', $this->price->id);
                    $this->price->name = $offerPrice?->name ?? $this->price->name;
                    return $this->price;
                },
            ),
            // 'discount' => $this->price->calculateDiscount()->getAmount(),
        ];
    }
}
