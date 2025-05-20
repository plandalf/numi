<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'quantity' => $this->quantity,
            'total_amount' => $this->total_amount,
            'price' => [
                'id' => $this->price->id,
                'amount' => $this->price->amount,
                'currency' => $this->price->currency,
                'product' => [
                    'id' => $this->price->product->id,
                    'name' => $this->price->product->name,
                ],
            ],
        ];
    }
}
