<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerPaymentMethod;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use Illuminate\Support\Facades\Log;

class CustomerPaymentService
{
    /**
     * Create or find a customer for a checkout session.
     */
    public function createOrFindCustomer(CheckoutSession $checkoutSession, array $billingDetails): Customer
    {
        // Try to find existing customer by email
        $customer = Customer::where('email', $billingDetails['email'])
            ->where('organization_id', $checkoutSession->organization_id)
            ->first();

        if (!$customer) {
            // Create new customer
            $customer = Customer::create([
                'organization_id' => $checkoutSession->organization_id,
                'integration_id' => $checkoutSession->integration->id,
                'reference_id' => null, // Will be set when we create Stripe customer
                'email' => $billingDetails['email'],
                'name' => $billingDetails['name'] ?? null,
            ]);
        }

        // Associate customer with checkout session
        $checkoutSession->update(['customer_id' => $customer->id]);

        return $customer;
    }

    /**
     * Store a payment method for a customer.
     */
    public function storePaymentMethod(Customer $customer, $stripePaymentMethod, array $paymentMethodDetails): CustomerPaymentMethod
    {
        $paymentMethodId = is_string($stripePaymentMethod) ? $stripePaymentMethod : $stripePaymentMethod->id;
        
        // Check if payment method already exists
        $existingPaymentMethod = $customer->paymentMethods()
            ->where('payment_method_id', $paymentMethodId)
            ->first();

        if ($existingPaymentMethod) {
            // Update last used timestamp
            $existingPaymentMethod->markAsUsed();
            return $existingPaymentMethod;
        }

        // Create new payment method
        $paymentMethod = $customer->paymentMethods()->create([
            'payment_method_id' => $paymentMethodId,
            'type' => $paymentMethodDetails['type'] ?? 'card',
            'details' => $paymentMethodDetails,
            'is_default' => $customer->paymentMethods()->count() === 0, // First payment method becomes default
            'last_used_at' => now(),
        ]);

        Log::info('Stored new payment method for customer', [
            'customer_id' => $customer->id,
            'payment_method_id' => $paymentMethodId,
            'type' => $paymentMethod->type,
        ]);

        return $paymentMethod;
    }

    /**
     * Get saved payment methods for a customer.
     */
    public function getSavedPaymentMethods(Customer $customer): array
    {
        return $customer->paymentMethods()
            ->orderBy('is_default', 'desc')
            ->orderBy('last_used_at', 'desc')
            ->get()
            ->map(function ($paymentMethod) {
                return [
                    'id' => $paymentMethod->payment_method_id,
                    'type' => $paymentMethod->type,
                    'display_name' => $paymentMethod->display_name,
                    'is_default' => $paymentMethod->is_default,
                    'last_used_at' => $paymentMethod->last_used_at,
                    'details' => $paymentMethod->details,
                ];
            })
            ->toArray();
    }

    /**
     * Associate customer with checkout session even if order processing fails.
     */
    public function ensureCustomerAssociation(CheckoutSession $checkoutSession, Customer $customer): void
    {
        if ($checkoutSession->customer_id !== $customer->id) {
            $checkoutSession->update(['customer_id' => $customer->id]);
            
            Log::info('Associated customer with checkout session', [
                'checkout_session_id' => $checkoutSession->id,
                'customer_id' => $customer->id,
            ]);
        }
    }

    /**
     * Mark a payment method as used and optionally as default.
     */
    public function markPaymentMethodAsUsed(Customer $customer, string $paymentMethodId, bool $setAsDefault = false): void
    {
        $paymentMethod = $customer->paymentMethods()
            ->where('payment_method_id', $paymentMethodId)
            ->first();

        if ($paymentMethod) {
            $paymentMethod->markAsUsed();
            
            if ($setAsDefault) {
                $paymentMethod->markAsDefault();
            }
        }
    }

    /**
     * Get customer for checkout session, creating if necessary.
     */
    public function getCustomerForCheckout(CheckoutSession $checkoutSession, array $billingDetails): Customer
    {
        // If checkout session already has a customer, return it
        if ($checkoutSession->customer) {
            return $checkoutSession->customer;
        }

        // Create or find customer
        return $this->createOrFindCustomer($checkoutSession, $billingDetails);
    }
} 