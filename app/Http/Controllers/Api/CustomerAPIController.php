<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\CustomerApiResponse;
use App\Models\Customer;
use Dedoc\Scramble\Attributes\Group;

#[Group('Customers')]
class CustomerAPIController
{
    /**
     * List all customers
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Customer $customer)
    {
        // This method should return customer details.
        // For now, we will return a placeholder response.
        return new CustomerApiResponse($customer);
    }
}
