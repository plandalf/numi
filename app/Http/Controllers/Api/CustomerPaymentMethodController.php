<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\CustomerPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CustomerPaymentMethodController extends Controller
{
    public function __construct(
        private readonly CustomerPaymentService $customerPaymentService
    ) {}

    /**
     * Get saved payment methods for a customer.
     */
    public function index(Customer $customer): JsonResponse
    {
        $paymentMethods = $this->customerPaymentService->getSavedPaymentMethods($customer);
        
        return response()->json([
            'payment_methods' => $paymentMethods
        ]);
    }

    /**
     * Mark a payment method as used.
     */
    public function markAsUsed(Customer $customer, Request $request): JsonResponse
    {
        $request->validate([
            'payment_method_id' => 'required|string',
            'set_as_default' => 'boolean'
        ]);

        $this->customerPaymentService->markPaymentMethodAsUsed(
            $customer,
            $request->input('payment_method_id'),
            $request->boolean('set_as_default', false)
        );

        return response()->json(['message' => 'Payment method marked as used']);
    }
} 