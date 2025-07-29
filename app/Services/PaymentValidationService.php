<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentValidationService
{
    /**
     * Determine the type of payment error based on the error message or code
     */
    public function determinePaymentErrorType(?string $errorMessage = null, ?string $errorCode = null): string
    {
        $errorMessage = strtolower($errorMessage ?? '');
        $errorCode = strtolower($errorCode ?? '');

        // Card errors
        if (Str::contains($errorMessage, ['expired', 'expiry']) ||
            Str::contains($errorCode, ['expired', 'expiry'])) {
            return 'card_expired';
        }

        if (Str::contains($errorMessage, ['insufficient', 'funds', 'balance']) ||
            Str::contains($errorCode, ['insufficient', 'funds', 'balance'])) {
            return 'insufficient_funds';
        }

        if (Str::contains($errorMessage, ['declined', 'decline', 'rejected', 'reject']) ||
            Str::contains($errorCode, ['declined', 'decline', 'rejected', 'reject'])) {
            return 'card_declined';
        }

        if (Str::contains($errorMessage, ['blocked', 'block', 'restricted']) ||
            Str::contains($errorCode, ['blocked', 'block', 'restricted'])) {
            return 'card_blocked';
        }

        if (Str::contains($errorMessage, ['invalid', 'incorrect']) ||
            Str::contains($errorCode, ['invalid', 'incorrect'])) {
            return 'invalid_card';
        }

        // Default error type
        return 'payment_failed';
    }

    /**
     * Get a user-friendly error message based on the error type
     */
    public function getUserFriendlyErrorMessage(string $errorType): string
    {
        return match ($errorType) {
            'card_expired' => 'Your card has expired. Please update your payment information.',
            'insufficient_funds' => 'Your card has insufficient funds. Please use a different payment method.',
            'card_declined' => 'Your card was declined. Please check your card details or use a different card.',
            'card_blocked' => 'Your card appears to be blocked. Please contact your bank or use a different card.',
            'invalid_card' => 'The card information you provided is invalid. Please check and try again.',
            default => 'There was a problem processing your payment. Please try again or use a different payment method.',
        };
    }

    /**
     * Validate a subscription payment
     *
     * @param  mixed  $subscription
     */
    public function validateSubscriptionPayment($subscription): array
    {
        $isValid = true;
        $errorType = null;
        $errorMessage = null;
        $errorDetails = null;

        // Check if subscription exists
        if (! $subscription) {
            return [
                'is_valid' => false,
                'error_type' => 'subscription_not_found',
                'error_message' => 'Subscription not found',
                'error_details' => null,
            ];
        }

        // Check subscription status
        if ($subscription->status !== 'active' && $subscription->status !== 'trialing') {
            $isValid = false;
            $errorType = 'subscription_inactive';
            $errorMessage = 'Subscription is not active';
            $errorDetails = ['status' => $subscription->status];
        }

        // Check for payment issues in the latest invoice
        if (isset($subscription->latest_invoice) &&
            isset($subscription->latest_invoice->payment_intent) &&
            $subscription->latest_invoice->payment_intent->status !== 'succeeded') {

            $paymentIntent = $subscription->latest_invoice->payment_intent;
            $isValid = false;

            // Extract error information
            $errorCode = $paymentIntent->last_payment_error?->code ?? null;
            $errorMessage = $paymentIntent->last_payment_error?->message ?? 'Payment failed';

            // Determine the specific error type
            $errorType = $this->determinePaymentErrorType($errorMessage, $errorCode);

            $errorDetails = [
                'payment_intent_id' => $paymentIntent->id,
                'status' => $paymentIntent->status,
                'error_code' => $errorCode,
                'error_message' => $errorMessage,
            ];

            Log::error('Subscription payment validation failed', $errorDetails);
        }

        return [
            'is_valid' => $isValid,
            'error_type' => $errorType,
            'error_message' => $errorMessage,
            'error_details' => $errorDetails,
        ];
    }

    /**
     * Validate a one-time payment
     *
     * @param  mixed  $paymentIntent
     */
    public function validateOneTimePayment($paymentIntent): array
    {
        $isValid = true;
        $errorType = null;
        $errorMessage = null;
        $errorDetails = null;

        // Check if payment intent exists
        if (! $paymentIntent) {
            return [
                'is_valid' => false,
                'error_type' => 'payment_intent_not_found',
                'error_message' => 'Payment intent not found',
                'error_details' => null,
            ];
        }

        // Check payment intent status
        if ($paymentIntent->status !== 'succeeded') {
            $isValid = false;

            // Extract error information
            $errorCode = $paymentIntent->last_payment_error?->code ?? null;
            $errorMessage = $paymentIntent->last_payment_error?->message ?? 'Payment failed';

            // Determine the specific error type
            $errorType = $this->determinePaymentErrorType($errorMessage, $errorCode);

            $errorDetails = [
                'payment_intent_id' => $paymentIntent->id,
                'status' => $paymentIntent->status,
                'error_code' => $errorCode,
                'error_message' => $errorMessage,
            ];

            Log::error('One-time payment validation failed', $errorDetails);
        }

        return [
            'is_valid' => $isValid,
            'error_type' => $errorType,
            'error_message' => $errorMessage,
            'error_details' => $errorDetails,
        ];
    }

    /**
     * Validate a confirmed payment from JIT flow
     *
     * @param  \App\Models\Checkout\CheckoutSession  $checkoutSession
     */
    public function validateConfirmedPayment($checkoutSession): array
    {
        $isValid = true;
        $errorType = null;
        $errorMessage = null;
        $errorDetails = null;

        // Check if checkout session has confirmed payment
        if (!$checkoutSession->payment_confirmed_at || !$checkoutSession->intent_id) {
            return [
                'is_valid' => false,
                'error_type' => 'payment_not_confirmed',
                'error_message' => 'Payment has not been confirmed',
                'error_details' => [
                    'payment_confirmed_at' => $checkoutSession->payment_confirmed_at,
                    'intent_id' => $checkoutSession->intent_id,
                ],
            ];
        }

        // Get the integration client to retrieve the intent
        $integrationClient = $checkoutSession->integrationClient();
        if (!$integrationClient) {
            return [
                'is_valid' => false,
                'error_type' => 'integration_not_found',
                'error_message' => 'Payment integration not found',
                'error_details' => [
                    'checkout_session_id' => $checkoutSession->id,
                ],
            ];
        }

        try {
            // Retrieve the intent from Stripe to verify its status
            $intent = $integrationClient->retrieveIntent($checkoutSession->intent_id, $checkoutSession->intent_type);
            
            if (!$intent) {
                return [
                    'is_valid' => false,
                    'error_type' => 'intent_not_found',
                    'error_message' => 'Payment intent not found',
                    'error_details' => [
                        'intent_id' => $checkoutSession->intent_id,
                        'intent_type' => $checkoutSession->intent_type,
                    ],
                ];
            }

            // Check intent status based on type
            if ($checkoutSession->intent_type === 'payment') {
                // For PaymentIntents, check if payment succeeded
                if ($intent->status !== 'succeeded' && $intent->status !== 'processing') {
                    $isValid = false;
                    $errorType = 'payment_failed';
                    $errorMessage = 'Payment was not successful';
                    $errorDetails = [
                        'intent_id' => $intent->id,
                        'status' => $intent->status,
                        'intent_type' => 'payment',
                    ];
                }
            } elseif ($checkoutSession->intent_type === 'setup') {
                // For SetupIntents, check if setup succeeded
                if ($intent->status !== 'succeeded') {
                    $isValid = false;
                    $errorType = 'setup_failed';
                    $errorMessage = 'Payment method setup was not successful';
                    $errorDetails = [
                        'intent_id' => $intent->id,
                        'status' => $intent->status,
                        'intent_type' => 'setup',
                    ];
                }
            }

            // If payment is valid, log success
            if ($isValid) {
                Log::info('JIT: Confirmed payment validation successful', [
                    'checkout_session_id' => $checkoutSession->id,
                    'intent_id' => $intent->id,
                    'intent_type' => $checkoutSession->intent_type,
                    'status' => $intent->status,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('JIT: Error validating confirmed payment', [
                'checkout_session_id' => $checkoutSession->id,
                'intent_id' => $checkoutSession->intent_id,
                'error' => $e->getMessage(),
            ]);

            return [
                'is_valid' => false,
                'error_type' => 'validation_error',
                'error_message' => 'Error validating payment: ' . $e->getMessage(),
                'error_details' => [
                    'intent_id' => $checkoutSession->intent_id,
                    'exception' => $e->getMessage(),
                ],
            ];
        }

        return [
            'is_valid' => $isValid,
            'error_type' => $errorType,
            'error_message' => $errorMessage,
            'error_details' => $errorDetails,
        ];
    }
}
