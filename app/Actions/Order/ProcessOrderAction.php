<?php

namespace App\Actions\Order;

use App\Actions\Fulfillment\AutoFulfillOrderAction;
use App\Actions\Fulfillment\SendOrderNotificationAction;
use App\Enums\ChargeType;
use App\Enums\CheckoutSessionStatus;
use App\Enums\OrderStatus;
use App\Enums\RenewInterval;
use App\Exceptions\CheckoutException;
use App\Exceptions\Payment\PaymentException;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\Customer;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\PaymentMethod;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;
use App\Modules\Integrations\Stripe\Stripe;
use App\Services\PaymentValidationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ProcessOrderAction
{
    protected PaymentValidationService $paymentValidationService;
    protected AutoFulfillOrderAction $autoFulfillOrderAction;
    protected SendOrderNotificationAction $sendOrderNotificationAction;
    private \Stripe\StripeClient $stripeClient;

    public function __construct(
        public CheckoutSession $session,
        PaymentValidationService $paymentValidationService,
        AutoFulfillOrderAction $autoFulfillOrderAction,
        SendOrderNotificationAction $sendOrderNotificationAction
    ) {
        $this->paymentValidationService = $paymentValidationService;
        $this->autoFulfillOrderAction = $autoFulfillOrderAction;
        $this->sendOrderNotificationAction = $sendOrderNotificationAction;
        $this->stripeClient = $this->session->paymentsIntegration->integrationClient()->getStripeClient();
    }

    public function __invoke(Order $order): Order
    {
        // CRITICAL: Check if order is already completed to prevent double charging
        if ($order->status === OrderStatus::COMPLETED) {
            return $this->orderAlreadyCompleted($order);
        }

        $checkoutSession = $this->session;

        $order->loadMissing('items.price.integration');

        $checkoutSession->load(['paymentMethod', 'customer']);

        $customer = $this->ensureCustomerExists($order, $checkoutSession);

        $order->customer()->associate($customer);

        // if Payment
        $paidOrder = match($this->session->intent_type) {
            'free' => $this->processFreeOrder($order),
            'payment' => $this->processPaymentIntent($order),
            'setup' => $this->processSetupIntent($order),
        };

        if (is_null($paidOrder)) {
            throw CheckoutException::message('Payment intent processing failed. Please check payment details.');
        }

        $order->markAsCompleted();
        $order->save();

        $this->handleOrderFulfillment($order);

        return $order;
    }

    public function processFreeOrder(Order $order)
    {
        return $order;
    }

    protected function processPaymentIntent(Order $order): ?Order
    {
        $intent = $this->stripeClient->paymentIntents->retrieve($this->session->intent_id);

        if ($intent->status === 'succeeded') {
            return $order;
        }

        return null;
    }

    protected function processSetupIntent(Order $order): ?Order
    {
        $intent = $this->stripeClient->setupIntents->retrieve($this->session->intent_id);

        // Check if the setup intent was successful
        if ($intent->status !== 'succeeded') {
            $errorMessage = $setupIntent->last_setup_error?->message ?? $intent->status;
            $errorType = $this->paymentValidationService->determinePaymentErrorType(
                $errorMessage,
                $intent->last_setup_error?->code
            );

            $errorDetails = [
                'setup_intent_id' => $intent->id,
                'status' => $intent->status,
                'error' => $intent->last_setup_error ?? null,
            ];

            Log::error('Setup intent failed', $errorDetails);

            $this->session->markAsFailed(true);

            throw new PaymentException(
                $this->paymentValidationService->getUserFriendlyErrorMessage($errorType),
                $errorType,
                $errorDetails
            );
        }

        $orderItems = $order->items;

        /** Group by price type. ex. subscription, one-time, etc. */
        $groupedItems = $orderItems
            ->groupBy(function (OrderItem $item) {
                return $item->price->type->value;
            });

        $stripe = $this->stripeClient;

        $subscriptionItems = [];

        foreach ($groupedItems->get('recurring', []) as $item) {
            $cancelAt = $this->getAutoCancelationTimestamp($item->price);

            $subscriptionItems[] = [
                'price' => $item['price']['gateway_price_id'],
                'quantity' => $item['quantity'] ?? 1,
            ];
        }

        $oneOffItems = [];
        foreach ($groupedItems->get('one_time', []) as $item) {
            if (empty($item['price']['gateway_price_id'])) {
                continue;
            }
            $oneOffItems[] = [
                'price' => $item['price']['gateway_price_id'],
                'quantity' => $item['quantity'] ?? 1,
            ];
        }

        if ($orderItems->isEmpty()) {
            throw new \Exception('No items found in the order');
        }


        $subscriptionData = [
            'customer' => $order->customer->reference_id,
            'default_payment_method' => $intent->payment_method,
            'items' => $subscriptionItems,
            'add_invoice_items' => $oneOffItems,
            'payment_settings' => [
                'save_default_payment_method' => 'on_subscription',
            ],
            'expand' => [
                'latest_invoice.payment_intent',
            ],
        ];

        $discounts = $this->session->discounts;

        // Add discounts if any
        if (!empty($discounts)) {
            $promotionCodes = [];
            foreach ($discounts as $discount) {
                try {
                    // Try to get the promotion code for this coupon
                    $promotionCode = $this->stripeClient->promotionCodes->all([
                        'code' => $discount['id'],
                        'active' => true,
                        'limit' => 1
                    ])->data[0] ?? null;

                    if ($promotionCode) {
                        $promotionCodes[] = $promotionCode->id;
                    } else {
                        // If no promotion code found, try to use as a direct coupon
                        $coupon = $this->stripeClient->coupons->retrieve($discount['id']);
                        if ($coupon) {
                            $subscriptionData['coupon'] = $coupon->id;
                            break; // Only one direct coupon can be applied
                        }
                    }
                } catch (\Exception $e) {
                    logger()->warning(logname('fail.discount-apply'), [
                        'discount_id' => $discount['id'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Add promotion codes if any were found
            if (!empty($promotionCodes)) {
                $subscriptionData['promotion_code'] = $promotionCodes[0]; // Use first promotion code
            }
        }

        if ($cancelAt) {
            $subscriptionData['cancel_at'] = $cancelAt;
        }

        $sub = $stripe->subscriptions->create($subscriptionData);

        logger()->info(logname(), [
            'subscription_id' => $sub->id,
        ]);

        return $order;
    }


    public function getAutoCancelationTimestamp(Price $price)
    {
        if ($price->type === ChargeType::ONE_TIME->value) {
            return null;
        }

        $cancelAfterCycles = $price->cancel_after_cycles;

        if ($cancelAfterCycles) {
            $renewInterval = $price->renew_interval;

            if ($renewInterval === RenewInterval::DAY->value) {
                return now()->addDays($cancelAfterCycles)->timestamp;
            } elseif ($renewInterval === RenewInterval::WEEK->value) {
                return now()->addWeeks($cancelAfterCycles)->timestamp;
            } elseif ($renewInterval === RenewInterval::MONTH->value) {
                return now()->addMonths($cancelAfterCycles)->timestamp;
            } elseif ($renewInterval === RenewInterval::YEAR->value) {
                return now()->addYears($cancelAfterCycles)->timestamp;
            }
        }

        return null;
    }

    /**
     * Ensure customer exists for the order, creating one if necessary
     */
    private function ensureCustomerExists(Order $order, CheckoutSession $session): Customer {

        if ($order->customer) {
            return $order->customer;
        }

        // Check if customer exists on the checkout session
        if ($session->customer) {
            $order->customer_id = $session->customer->id;
            $order->save();

            return $session->customer;
        }

        throw new \Exception('Customer is required for payment processing. Please ensure customer information is provided during checkout.');
    }

    /**
     * Handle order fulfillment after successful payment.
     */
    protected function handleOrderFulfillment(Order $order): void
    {
        try {
            // Send order notification email
            $this->sendOrderNotificationAction->execute($order);

            // Auto-fulfill order if configured
            $this->autoFulfillOrderAction->execute($order);

        } catch (\Exception $e) {
            // Log fulfillment errors but don't fail the order
            Log::error('Order fulfillment processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
    private function orderAlreadyCompleted(Order $order)
    {
        Log::warning('Attempted to process already completed order', [
            'order_id' => $order->id,
            'order_status' => $order->status->value,
            'completed_at' => $order->completed_at,
        ]);
        return $order;
    }
}
