<?php

namespace App\Actions\Order;

use App\Actions\Fulfillment\AutoFulfillOrderAction;
use App\Actions\Fulfillment\SendOrderNotificationAction;
use App\Enums\ChargeType;
use App\Enums\RenewInterval;
use App\Exceptions\Payment\PaymentException;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;
use App\Modules\Integrations\Stripe\Stripe;
use App\Services\PaymentValidationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ProcessOrder
{
    protected PaymentValidationService $paymentValidationService;
    protected AutoFulfillOrderAction $autoFulfillOrderAction;
    protected SendOrderNotificationAction $sendOrderNotificationAction;

    public function __construct(
        PaymentValidationService $paymentValidationService,
        AutoFulfillOrderAction $autoFulfillOrderAction,
        SendOrderNotificationAction $sendOrderNotificationAction
    ) {
        $this->paymentValidationService = $paymentValidationService;
        $this->autoFulfillOrderAction = $autoFulfillOrderAction;
        $this->sendOrderNotificationAction = $sendOrderNotificationAction;
    }

    public function __invoke(Order $order, CheckoutSession $checkoutSession, ?string $confirmationToken = null): Order
    {
        try {
            $integrationClient = $checkoutSession->integrationClient();
            $order->loadMissing('items.price.integration');
            $orderItems = $order->items;

            // Determine if we need setup intent (for subscriptions) or direct payment intent
            $hasSubscriptionItems = $this->hasSubscriptionItems($orderItems);
            $hasOnlyOneTimeItems = $this->hasOnlyOneTimeItems($orderItems);

            // Handle setup intent flow for subscriptions
            if ($hasSubscriptionItems && $integrationClient instanceof CanSetupIntent && $confirmationToken) {
                $setupIntent = $integrationClient->createSetupIntent($order, $confirmationToken);

                // Check if the setup intent was successful
                if ($setupIntent->status !== 'succeeded') {
                    $errorMessage = $setupIntent->last_setup_error?->message ?? $setupIntent->status;
                    $errorType = $this->paymentValidationService->determinePaymentErrorType(
                        $errorMessage,
                        $setupIntent->last_setup_error?->code
                    );

                    $errorDetails = [
                        'setup_intent_id' => $setupIntent->id,
                        'status' => $setupIntent->status,
                        'error' => $setupIntent->last_setup_error ?? null,
                    ];

                    Log::error('Setup intent failed', $errorDetails);

                    $checkoutSession->markAsFailed(true);
                    throw new PaymentException(
                        $this->paymentValidationService->getUserFriendlyErrorMessage($errorType),
                        $errorType,
                        $errorDetails
                    );
                }
            }

            $order->loadMissing('items.price.integration');
            $orderItems = $order->items;

            /** Group by price type. ex. subscription, one-time, etc. */
            $groupedItems = $orderItems->groupBy(function (OrderItem $item) {
                return $item->price->type->value;
            });

            Log::info('ProcessOrder', ['orderItems' => $orderItems]);

            if ($orderItems->isEmpty()) {
                throw new \Exception('No items found in the order');
            }

            // Get discounts from checkout session
            $discounts = $checkoutSession->discounts ?? [];

            // If everything is a one-time charge and the total is zero, mark the order as completed
            if ($groupedItems->has(ChargeType::ONE_TIME->value) && $groupedItems->count() === 1) {
                $total = $order->total_amount;
                if ($total <= 0) {
                    $order->markAsCompleted();
                    $order->save();
                    return $order;
                }
            }

            // Process each group of items based on their type
            $groupedItems->each(function (Collection $items, $type) use ($integrationClient, $order, $checkoutSession, $discounts) {
                // Handle subscription items (graduated, volume, package)
                if (in_array($type, [ChargeType::GRADUATED->value, ChargeType::VOLUME->value, ChargeType::PACKAGE->value, ChargeType::RECURRING->value])
                    && $integrationClient instanceof CanCreateSubscription) {
                    $subscription = $integrationClient->createSubscription([
                        'order' => $order,
                        'items' => $items->toArray(),
                        'discounts' => $discounts,
                        'cancel_at' => $this->getAutoCancelationTimestamp($items->first()->price),
                    ]);

                    // Validate the subscription payment
                    $validationResult = $this->paymentValidationService->validateSubscriptionPayment($subscription);

                    if (! $validationResult['is_valid']) {
                        $errorDetails = array_merge(
                            ['subscription_id' => $subscription->id],
                            $validationResult['error_details'] ?? []
                        );

                        Log::error('Subscription creation failed', $errorDetails);

                        $checkoutSession->markAsFailed(true);
                        throw new PaymentException(
                            $this->paymentValidationService->getUserFriendlyErrorMessage($validationResult['error_type']),
                            $validationResult['error_type'],
                            $errorDetails
                        );
                    }
                }
                // Handle one-time payment items
                elseif ($type === ChargeType::ONE_TIME->value) {
                    /** @var Stripe $integrationClient */
                    
                    // If we have only one-time items and a confirmation token, use direct payment intent
                    if ($hasOnlyOneTimeItems && $confirmationToken) {
                        $paymentIntent = $integrationClient->createDirectPaymentIntent([
                            'order' => $order,
                            'items' => $items->toArray(),
                            'discounts' => $discounts,
                            'confirmation_token' => $confirmationToken,
                        ]);
                    } else {
                        // Use existing flow (requires saved payment method from setup intent)
                        $paymentIntent = $integrationClient->createPaymentIntent([
                            'order' => $order,
                            'items' => $items->toArray(),
                            'discounts' => $discounts,
                        ]);
                    }

                    // Validate the one-time payment
                    $validationResult = $this->paymentValidationService->validateOneTimePayment($paymentIntent);

                    if (! $validationResult['is_valid']) {
                        $errorDetails = array_merge(
                            ['payment_intent_id' => $paymentIntent->id],
                            $validationResult['error_details'] ?? []
                        );

                        Log::error('Payment intent creation failed', $errorDetails);

                        $checkoutSession->markAsFailed(true);
                        throw new PaymentException(
                            $this->paymentValidationService->getUserFriendlyErrorMessage($validationResult['error_type']),
                            $validationResult['error_type'],
                            $errorDetails
                        );
                    }
                }
                // Handle other types of charges if needed
                else {
                    Log::warning('Unhandled charge type', [
                        'order_id' => $order->id,
                        'type' => $type,
                    ]);
                }
            });

            $order->markAsCompleted();
            $order->save();

            // Handle fulfillment after successful payment
            $this->handleOrderFulfillment($order);

            return $order;
        } catch (PaymentException $e) {
            Log::error('Payment processing failed', [
                'order_id' => $order->id,
                'error_type' => $e->getErrorType(),
                'error_message' => $e->getMessage(),
                'error_details' => $e->getErrorDetails(),
            ]);

            $checkoutSession->markAsFailed(true);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Order processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $checkoutSession->markAsFailed(true);
            throw $e;
        }
    }

    public function getAutoCancelationTimestamp(Price $price)
    {
        if($price->type === ChargeType::ONE_TIME->value) {
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
     * Check if order contains subscription items (recurring charges)
     */
    private function hasSubscriptionItems(Collection $orderItems): bool
    {
        return $orderItems->some(function (OrderItem $item) {
            return in_array($item->price->type->value, [
                ChargeType::GRADUATED->value,
                ChargeType::VOLUME->value,
                ChargeType::PACKAGE->value,
                ChargeType::RECURRING->value
            ]) && !empty($item->price->renew_interval);
        });
    }

    /**
     * Check if order contains only one-time payment items
     */
    private function hasOnlyOneTimeItems(Collection $orderItems): bool
    {
        return $orderItems->every(function (OrderItem $item) {
            return $item->price->type->value === ChargeType::ONE_TIME->value;
        });
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
}
