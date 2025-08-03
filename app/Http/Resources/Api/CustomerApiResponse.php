<?php

namespace App\Http\Resources\Api;

use App\Models\Customer;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Customer
 */
class CustomerApiResponse extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            'id' => $this->getRouteKey(),
            'reference_id' => $this->reference_id,
            'name' => $this->name,
            'email' => $this->email,
            'currency' => $this->currency,
            'timezone' => $this->timezone,
            'has_default_payment_method' => $this->hasDefaultPaymentMethod(),
            'is_new_customer' => $this->isNewCustomer(),
            'created_at' => $this->created_at,
        ];
    }
}
