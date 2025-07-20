<?php

namespace App\Actions\Checkout;

use App\Actions\Order\CreateOrderAction;
use App\Actions\Order\CreateOrderItemAction;
use App\Actions\Order\ProcessOrderAction;
use App\Enums\CheckoutSessionStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use Illuminate\Support\Facades\Log;

class CommitCheckoutAction
{
    public function __construct(
        private readonly CreateOrderAction     $createOrderAction,
        private readonly CreateOrderItemAction $createOrderItemAction,
    ) {}

    //, ?string $confirmationToken = null, ?string $email = null
    public function __invoke(CheckoutSession $checkoutSession): Order
    {
        $process = app(ProcessOrderAction::class, ['session' => $checkoutSession]);


        // If the checkout session is already closed, return it
        if ($checkoutSession->status === CheckoutSessionStatus::CLOSED
            || $checkoutSession->status === CheckoutSessionStatus::FAILED
        ) {
            return ($this->processOrder)($checkoutSession->order, $checkoutSession, $confirmationToken, $email);
        }

        Log::info(logname('creating-order'));
        $order = ($this->createOrderAction)($checkoutSession);
        Log::info(logname('created-order'), [
            'id' => $order->id,
        ]);

        // Create order items from checkout line items
        foreach ($checkoutSession->lineItems as $lineItem) {
            Log::info(logname('processing-item'), [
                'id' => $lineItem->id,
            ]);
            ($this->createOrderItemAction)($order, $lineItem);
        }

        $processed = ($this->processOrder)($order, $checkoutSession, $confirmationToken, $email);

        $checkoutSession->markAsClosed(true);


        // Mark payment as confirmed locally
        $checkoutSession->update([
//            'payment_confirmed_at' => now(),
            'status' => \App\Enums\CheckoutSessionStatus::CLOSED,
            // finalised at happens NOW
            'metadata' => array_merge($checkoutSession->metadata ?? [], [
                'committed_at' => now()->toISOString(),
//                'payment_status' => $paymentStatus,
            ])
        ]);

        return $processed;
    }

    private function verifyPaymentStatus(CheckoutSession $checkoutSession): array
    {
        try {
            $integrationClient = $checkoutSession->integrationClient();

            if (!$integrationClient) {
                return [
                    'is_paid' => false,
                    'error' => 'Integration client not available',
                    'intent_status' => null,
                ];
            }

            // Retrieve the intent from Stripe to check its current state
            $intent = $integrationClient->retrieveIntent($checkoutSession->intent_id, $checkoutSession->intent_type);

            if (!$intent) {
                return [
                    'is_paid' => false,
                    'error' => 'Intent not found or invalid',
                    'intent_status' => null,
                ];
            }

            $intentStatus = $intent->status;
            $isPaid = false;
            $error = null;

            // Determine if payment is confirmed based on intent type and status
            if ($checkoutSession->intent_type === 'payment') {
                // For PaymentIntents, check if payment succeeded
                $isPaid = in_array($intentStatus, ['succeeded', 'processing']);

                if ($intentStatus === 'requires_payment_method') {
                    $error = 'Payment method is required';
                } elseif ($intentStatus === 'requires_action') {
                    $error = 'Payment requires additional action';
                } elseif ($intentStatus === 'canceled') {
                    $error = 'Payment was canceled';
                } elseif ($intentStatus === 'requires_confirmation') {
                    $error = 'Payment requires confirmation';
                }
            } elseif ($checkoutSession->intent_type === 'setup') {
                // For SetupIntents, check if setup succeeded
                $isPaid = in_array($intentStatus, ['succeeded']);

                if ($intentStatus === 'requires_payment_method') {
                    $error = 'Payment method is required';
                } elseif ($intentStatus === 'requires_action') {
                    $error = 'Setup requires additional action';
                } elseif ($intentStatus === 'canceled') {
                    $error = 'Setup was canceled';
                } elseif ($intentStatus === 'requires_confirmation') {
                    $error = 'Setup requires confirmation';
                }
            }

            // Update local state based on Stripe's state
            $checkoutSession->update([
                'payment_confirmed_at' => $isPaid ? now() : null,
                'metadata' => array_merge($checkoutSession->metadata ?? [], [
                    'last_payment_verification' => now()->toISOString(),
                    'intent_status' => $intentStatus,
                    'is_paid' => $isPaid,
                    'verification_error' => $error,
                ])
            ]);

            return [
                'is_paid' => $isPaid,
                'intent_status' => $intentStatus,
                'intent_type' => $checkoutSession->intent_type,
                'intent_id' => $checkoutSession->intent_id,
                'error' => $error,
                'amount' => $intent->amount ?? null,
                'currency' => $intent->currency ?? null,
                'customer' => $intent->customer ?? null,
                'payment_method' => $intent->payment_method ?? null,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to verify payment status', [
                'checkout_session_id' => $checkoutSession->id,
                'intent_id' => $checkoutSession->intent_id,
                'error' => $e->getMessage(),
            ]);

            return [
                'is_paid' => false,
                'error' => 'Failed to verify payment status: ' . $e->getMessage(),
                'intent_status' => null,
            ];
        }
    }


    /**
     * Check if any of the payment methods require redirects
     */
    private function hasRedirectMethods(array $methods): bool
    {
        $redirectMethods = [
            'ideal', 'sofort', 'bancontact', 'giropay', 'eps', 'p24', 'alipay', 'wechat_pay',
            'klarna', 'afterpay_clearpay', 'affirm', 'fpx', 'grabpay', 'oxxo', 'boleto',
            'konbini', 'paynow', 'promptpay', 'zip', 'swish', 'twint', 'mb_way', 'multibanco',
            'blik', 'mobilepay', 'vipps', 'satispay'
        ];

        return !empty(array_intersect($methods, $redirectMethods));
    }

}
