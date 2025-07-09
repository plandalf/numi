<?php

namespace App\Actions\Checkout;

use App\Actions\Order\CreateOrderAction;
use App\Actions\Order\CreateOrderItemAction;
use App\Actions\Order\ProcessOrder;
use App\Enums\CheckoutSessionStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class CommitCheckoutAction
{
    public function __construct(
        private readonly CreateOrderAction $createOrderAction,
        private readonly CreateOrderItemAction $createOrderItemAction,
        private readonly ProcessOrder $processOrder,
    ) {}

    public function execute(CheckoutSession $checkoutSession, ?string $confirmationToken = null): Order
    {
        try {
            // Check if this checkout session already has an order to prevent double processing
            if ($checkoutSession->order) {
                Log::debug('Checkout session already has an order, returning existing order', [
                    'checkout_session_id' => $checkoutSession->id,
                    'order_id' => $checkoutSession->order->id,
                ]);
                $order = $checkoutSession->order;
                $order->load(['checkoutSession', 'items']);
                return $order;
            }

            // If the checkout session has failed, throw an exception
            if ($checkoutSession->status === CheckoutSessionStatus::FAILED) {
                throw new \Exception('Checkout session has failed');
            }

            // Check if we have any line items with prices that need integration
            $hasIntegrationPrices = false;
            $hasNonIntegrationPrices = false;

            foreach ($checkoutSession->lineItems as $lineItem) {
                if ($lineItem->price && $lineItem->price->integration_id) {
                    $hasIntegrationPrices = true;
                } else {
                    $hasNonIntegrationPrices = true;
                }
            }

            // If we have integration prices but no integration, that's an error
            if ($hasIntegrationPrices && !$checkoutSession->integration) {
                $errorMessage = 'Checkout contains items that require payment processing but no payment integration is configured';
                $checkoutSession->setError($errorMessage, 'NO_INTEGRATION', null, true);

                throw new \Exception($errorMessage);
            }

            $order = ($this->createOrderAction)($checkoutSession);

            // Create order items from checkout line items
            foreach ($checkoutSession->lineItems as $lineItem) {
                ($this->createOrderItemAction)($order, $lineItem);
            }

            // If we only have non-integration prices, mark as closed immediately (manual processing)
            if ($hasNonIntegrationPrices && !$hasIntegrationPrices) {

                // TODO: What is this?

                $checkoutSession->markAsClosed(true);
                Log::info('Checkout completed with manual processing prices', [
                    'checkout_session_id' => $checkoutSession->id,
                    'order_id' => $order->id,
                ]);
            } else {
                // Ensure the order is loaded with relationships before processing
                $order->load(['checkoutSession', 'items']);

                // Process the order (this will handle payment processing)
                $processedOrder = ($this->processOrder)($order, $checkoutSession, $confirmationToken);
                $order = $processedOrder;

                // note: read this
                //
                // --- Save payment method used ---
                $integration = $checkoutSession->integration;
                if ($integration && $integration->type === 'stripe') {
                    $stripePaymentIntentId = $order->metadata['stripe_payment_intent_id'] ?? null;
                    if ($stripePaymentIntentId) {
                        $stripe = app(\App\Modules\Integrations\Stripe\Stripe::class, ['integration' => $integration]);
                        $paymentIntent = $stripe->stripeClient->paymentIntents->retrieve($stripePaymentIntentId);
                        if ($paymentIntent && $paymentIntent->payment_method) {
                            $stripePaymentMethod = $stripe->stripeClient->paymentMethods->retrieve($paymentIntent->payment_method);
                            $pm = new \App\Models\PaymentMethod([
                                'integration_id' => $integration->id,
                                'type' => $stripePaymentMethod->type,
                                'brand' => $stripePaymentMethod->card->brand ?? null,
                                'last4' => $stripePaymentMethod->card->last4 ?? null,
                                'exp_month' => $stripePaymentMethod->card->exp_month ?? null,
                                'exp_year' => $stripePaymentMethod->card->exp_year ?? null,
                                'external_id' => $stripePaymentMethod->id,
                                'metadata' => json_encode($stripePaymentMethod),
                            ]);
                            $pm->save();
                            $checkoutSession->payment_method_id = $pm->id;
                            $checkoutSession->save();
                        }
                    }
                }
            }

            // Generate signed URL for order status page
            $orderStatusUrl = URL::signedRoute('order-status.show', ['order' => $order], now()->addDays(30));

            return $order;

        } catch (\Exception $e) {
            // Store error information on the checkout session
            $checkoutSession->setError(
                $e->getMessage(),
                $e->getCode() ?: 'CHECKOUT_ERROR',
                [
                    'exception_class' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ],
                true
            );

            \Log::error('Checkout commit failed', [
                'checkout_session_id' => $checkoutSession->id,
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
            ]);

            throw $e;
        }
    }
}
