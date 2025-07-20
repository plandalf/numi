<?php

namespace App\Actions\Order;

use App\Actions\Fulfillment\AutoFulfillOrderAction;
use App\Actions\Fulfillment\SendOrderNotificationAction;
use App\Enums\ChargeType;
use App\Enums\CheckoutSessionStatus;
use App\Enums\OrderStatus;
use App\Enums\RenewInterval;
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

    public function __construct(
        CheckoutSession $session,
        PaymentValidationService $paymentValidationService,
        AutoFulfillOrderAction $autoFulfillOrderAction,
        SendOrderNotificationAction $sendOrderNotificationAction
    ) {
        $this->paymentValidationService = $paymentValidationService;
        $this->autoFulfillOrderAction = $autoFulfillOrderAction;
        $this->sendOrderNotificationAction = $sendOrderNotificationAction;


    }

    public function __invoke(Order $order, CheckoutSession $checkoutSession, ?string $confirmationToken = null, ?string $email = null): Order
    {
        // CRITICAL: Check if order is already completed to prevent double charging
        if ($order->status === OrderStatus::COMPLETED) {
            Log::warning('Attempted to process already completed order', [
                'order_id' => $order->id,
                'checkout_session_id' => $checkoutSession->id,
                'order_status' => $order->status->value,
                'completed_at' => $order->completed_at,
            ]);
            return $order; // Return the order without processing
        }

        // CRITICAL: Check if checkout session is already finalized
        if ($checkoutSession->status === CheckoutSessionStatus::CLOSED) {
            Log::warning('Attempted to process order for already closed checkout session', [
                'order_id' => $order->id,
                'checkout_session_id' => $checkoutSession->id,
                'checkout_status' => $checkoutSession->status->value,
                'finalized_at' => $checkoutSession->finalized_at,
            ]);

            return $order; // Return the order without processing
        }

        $integrationClient = $checkoutSession->integrationClient();
        $order->loadMissing('items.price.integration');
        $checkoutSession->load(['paymentMethod', 'customer']);

        // note: these may be empty
        $orderItems = $order->items;

        // Aggressively find or create customer early in the process
        $customer = $this->ensureCustomerExists($order, $checkoutSession, $confirmationToken, $integrationClient);

        // Update customer email if provided and different from current
        if ($email && $customer && $email !== $customer->email) {
            $this->updateCustomerEmail($customer, $email, $integrationClient);
        }

        // Determine if we need setup intent (for subscriptions) or direct payment intent
        $hasSubscriptionItems = $this->hasSubscriptionItems($orderItems);
        $hasOnlyOneTimeItems = $this->hasOnlyOneTimeItems($orderItems);


        // todo: this is already set on the checkout.
        Log::info(logname('order-type'), [
            'has_subscription_items' => $hasSubscriptionItems,
            'has_only_one_time_items' => $hasOnlyOneTimeItems,
            'has_both' => $hasSubscriptionItems && !$hasOnlyOneTimeItems,
            'intent' => $checkoutSession->intent_type,
        ]);

        // if its payment, its probably already paid at this point

        // if setup, we need to take action to ocnfigure it

        try {


            // Handle setup intent flow for subscriptions
            if ($hasSubscriptionItems && $integrationClient instanceof CanSetupIntent && $confirmationToken) {

                // todo; get the intent from the checkout!
                $setupIntent = $integrationClient->createSetupIntent($order, $confirmationToken);

                // setup
                // continue after klarna?

                // Store setup intent information on the order
                $order->setIntent(
                    $setupIntent->id,
                    'setup',
//                    $setupIntent->status,
//                    [
//                        'setup_intent_created_at' => now()->toISOString(),
//                        'payment_method_id' => $setupIntent->payment_method ?? null,
//                    ]
                );

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

                // what has this done at this point?
                // created setup intent .
            }

            // note: this should always exist the same on every item?

            $order->loadMissing('items.price.integration');
            $orderItems = $order->items;

            /** Group by price type. ex. subscription, one-time, etc. */
            $groupedItems = $orderItems
                ->groupBy(function (OrderItem $item) {
                    return $item->price->type->value;
                });

            Log::info('ProcessOrder', ['orderItems' => $orderItems->all()]);

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

                    // note: no intent required here
                    // todo: no payment attached to the order either!

                    return $order;
                }
            }

            // Process each group of items based on their type
            $groupedItems
                ->each(function (Collection $items, $type) use ($integrationClient, $order, $checkoutSession, $discounts, $hasOnlyOneTimeItems, $confirmationToken, $customer) {
                // Handle subscription items (graduated, volume, package)
                if (in_array($type, [ChargeType::GRADUATED->value, ChargeType::VOLUME->value, ChargeType::PACKAGE->value, ChargeType::RECURRING->value])
                    && $integrationClient instanceof CanCreateSubscription) {
                    $subscription = $integrationClient->createSubscription([
                        'order' => $order,
                        'items' => $items->toArray(),
                        'discounts' => $discounts,
                        'cancel_at' => $this->getAutoCancelationTimestamp($items->first()->price),
                    ]);

                    // Store subscription information on the order
                    // tODO? Why is this here???
//                    $order->storeSubscription(
//                        $subscription->id,
//                        $subscription->status,
//                        [
//                            'subscription_created_at' => now()->toISOString(),
//                            'subscription_items' => $items->count(),
//                            'cancel_at' => $this->getAutoCancelationTimestamp($items->first()->price),
//                        ]
//                    );

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

                    // Initialize payment intent variable
                    $paymentIntent = null;
                    $paymentValidated = false;

                    // JIT: Check if payment is already confirmed via JIT flow
                    if ($checkoutSession->payment_confirmed_at && $checkoutSession->intent_id) {
                        Log::info('JIT: Payment already confirmed, skipping payment intent creation', [
                            'checkout_session_id' => $checkoutSession->id,
                            'intent_id' => $checkoutSession->intent_id,
                            'intent_type' => $checkoutSession->intent_type,
                            'payment_confirmed_at' => $checkoutSession->payment_confirmed_at,
                        ]);

                        // Payment is already confirmed, no need to create payment intent
                        // Just validate that the payment was successful
                        $validationResult = $this->paymentValidationService->validateConfirmedPayment($checkoutSession);

                        if (!$validationResult['is_valid']) {
                            $errorDetails = array_merge(
                                ['intent_id' => $checkoutSession->intent_id],
                                $validationResult['error_details'] ?? []
                            );

                            Log::error('JIT: Confirmed payment validation failed', $errorDetails);

                            $checkoutSession->markAsFailed(true);
                            throw new PaymentException(
                                $this->paymentValidationService->getUserFriendlyErrorMessage($validationResult['error_type']),
                                $validationResult['error_type'],
                                $errorDetails
                            );
                        }

                        Log::info('JIT: Confirmed payment validation passed', [
                            'intent_id' => $checkoutSession->intent_id,
                            'validation_result' => $validationResult,
                        ]);

                        // JIT: Payment is already validated, mark as validated
                        $paymentValidated = true;
                    }
                    // Legacy: If we have only one-time items and a confirmation token, use direct payment intent
                    elseif ($hasOnlyOneTimeItems && $confirmationToken) {
                        // Ensure order has checkoutSession relationship loaded
                        $order->load('checkoutSession');

                        // we only have one-times for this order type
                        // and we have a confirmation token

                        // this uses the intent ?

                        $paymentIntent = $integrationClient->createDirectPaymentIntent([
                            'order' => $order,
                            'items' => $items->toArray(),
                            'discounts' => $discounts,
                            'confirmation_token' => $confirmationToken,
                        ]);

                        // Store payment intent information on the order
                        $order->setIntent(
                            $paymentIntent->id,
                            'payment',
//                            [
//                                'payment_intent_created_at' => now()->toISOString(),
//                                'payment_method_id' => $paymentIntent->payment_method ?? null,
//                                'amount' => $paymentIntent->amount ?? null,
//                                'currency' => $paymentIntent->currency ?? null,
//                                'confirmation_token' => $confirmationToken,
//                            ]
                        );

                        Log::info(logname('payment-intent.success'), [
                            'payment_intent_id' => $paymentIntent->id ?? null,
                            'payment_method' => $paymentIntent->payment_method ?? null,
                            'status' => $paymentIntent->status ?? null,
                            'checkout_session_has_pm' => $checkoutSession->paymentMethod ? 'YES' : 'NO',
                        ]);

                        // ALWAYS create or update payment method after successful payment intent 🦆
                        if ($paymentIntent->payment_method) {
                            Log::info('🦆 [PRE] About to create or update payment method', [
                                'payment_intent_id' => $paymentIntent->id,
                                'stripe_payment_method_id' => $paymentIntent->payment_method,
                                'checkout_session_id' => $checkoutSession->id,
                                'customer_id' => $customer->id,
                                'has_payment_method' => $checkoutSession->paymentMethod ? 'YES' : 'NO',
                            ]);

                            // TODO: how would we know if the pm we've set is this one?

                            if ($checkoutSession->paymentMethod) {
                                $oldExternalId = $checkoutSession->paymentMethod->external_id;
                                $checkoutSession->paymentMethod->update([
                                    'external_id' => $paymentIntent->payment_method,
                                ]);
                                Log::info('🦆 [POST] Payment method external_id updated', [
                                    'payment_method_id' => $checkoutSession->paymentMethod->id,
                                    'old_external_id' => $oldExternalId,
                                    'new_external_id' => $paymentIntent->payment_method,
                                ]);
                            } else {
                                $paymentMethod = PaymentMethod::create([
                                    'external_id' => $paymentIntent->payment_method,
                                    'customer_id' => $customer->id,
                                    'organization_id' => $checkoutSession->organization_id,
                                    'integration_id' => $checkoutSession->integration?->id,
                                    'type' => 'card',
                                    'billing_details' => [
                                        'email' => $customer->email,
                                        'name' => $customer->name,
                                    ],
                                    'properties' => [], // from pm (same as "card")
                                    //
                                    'metadata' => [], // from pm
                                    'can_redisplay' => true,
                                ]);

                                // Store payment method information on the order
                                // todo: its NOT always a card
//                                $order->storePaymentMethod(
//                                    $paymentIntent->payment_method,
//                                    'card',
//                                    null, // brand will be updated when we get it from Stripe
//                                    null  // last4 will be updated when we get it from Stripe
//                                );

                                // Attach the payment method to the customer in Stripe and set as default
                                try {
                                    $integrationClient->getStripeClient()->paymentMethods->attach(
                                        $paymentIntent->payment_method,
                                        ['customer' => $customer->reference_id]
                                    );

                                    // Set as default payment method for the customer in Stripe
                                    $integrationClient->setDefaultPaymentMethod($customer->reference_id, $paymentIntent->payment_method);

                                    // Set as default payment method in our database for new customers (those without a default)
                                    $wasNewCustomer = !$customer->hasDefaultPaymentMethod();
                                    if ($wasNewCustomer) {
                                        $customer->setDefaultPaymentMethod($paymentMethod);
                                        Log::info('🦆 [POST] Payment method set as default for new customer in database', [
                                            'payment_method_id' => $paymentMethod->id,
                                            'customer_id' => $customer->id,
                                        ]);
                                    }

                                    Log::info(logname('pm-attached'), [
                                        'message' => '🦆 [POST] Payment method attached and set as default for customer in Stripe and database',
                                        'payment_method_id' => $paymentMethod->id,
                                        'stripe_payment_method_id' => $paymentIntent->payment_method,
                                        'customer_id' => $customer->id,
                                        'stripe_customer_id' => $customer->reference_id,
                                        'is_new_customer' => $wasNewCustomer,
                                    ]);
                                } catch (\Exception $e) {
                                    Log::warning(logname('pm-attach.fail'), [
                                        'message' => '🦆 Failed to attach payment method to customer in Stripe',
                                        'payment_method_id' => $paymentMethod->id,
                                        'stripe_payment_method_id' => $paymentIntent->payment_method,
                                        'customer_id' => $customer->id,
                                        'error' => $e->getMessage(),
                                    ]);
                                    // payment method needs atachment before intent!

                                    // This PaymentMethod was previously used without being attached to a Customer or
                                    // was detached from a Customer, and may not be used again

                                    // Don't fail the payment if attachment fails - the payment method still works
                                }

                                Log::info(logname('pm.continue'), [
                                    'message' => '🦆 [POST] Payment method CREATED in database',
                                    'payment_method_id' => $paymentMethod->id,
                                    'external_id' => $paymentMethod->external_id,
                                    'customer_id' => $customer->id,
                                    'organization_id' => $checkoutSession->organization_id,
                                    'integration_id' => $checkoutSession->integration?->id,
                                ]);
                                $checkoutSession->update([
                                    'payment_method_id' => $paymentMethod->id,
                                ]);

                                $checkoutSession->load('paymentMethod');
                            }

                            // Final check: ensure payment method is present and associated
                            $checkoutSession->refresh();
                            if (!$checkoutSession->paymentMethod || !$checkoutSession->paymentMethod->external_id) {
                                Log::error('🦆 [FAIL] Payment method not associated after payment', [
                                    'checkout_session_id' => $checkoutSession->id,
                                    'payment_method_id' => $checkoutSession->payment_method_id,
                                ]);
                                throw new \Exception('Payment succeeded but payment method was not saved or associated.');
                            }
                        } else {
                            Log::error(logname('intent-big-failure'), [
                                'message' => '🦆 [FAIL] NO PAYMENT METHOD IN PAYMENT INTENT - THIS SHOULD NOT HAPPEN',
                                'payment_intent_id' => $paymentIntent->id ?? null,
                                'payment_intent_status' => $paymentIntent->status ?? null,
                                'customer_id' => $customer->id,
                            ]);
                            throw new \Exception('Payment succeeded but no payment method was returned by Stripe.');
                        }

                        // Check if this is a redirect-based payment method that requires action
                        // For now, we'll check the payment intent status directly
                        if ($paymentIntent->status === 'requires_action') {
                            // For payment methods that require action (like redirect-based ones),
                            // we need to wait for the user to complete the action
                            Log::info('Payment method requires action', [
                                'payment_intent_id' => $paymentIntent->id,
                                'payment_method_id' => $paymentIntent->payment_method,
                                'status' => $paymentIntent->status,
                            ]);

                            // todo: how do we even handle this particular case?


                            // Don't mark the order as completed yet - it will be completed when the user returns from redirect
                            return $order;
                        }
                    } else if ($hasOnlyOneTimeItems && !$confirmationToken) {
                        // Use existing payment method from checkout session
                        $checkoutSession->load('paymentMethod');
                        $existingPaymentMethod = $checkoutSession->paymentMethod;
                        Log::info('Checking for existing payment method', [
                            'payment_method' => $existingPaymentMethod ? $existingPaymentMethod->external_id : null,
                            'hasOnlyOneTimeItems' => $hasOnlyOneTimeItems,
                            'confirmationToken' => $confirmationToken,
                        ]);
                        if (!$existingPaymentMethod || !$existingPaymentMethod->external_id || str_starts_with($existingPaymentMethod->external_id, 'temp_')) {
                            throw new PaymentException(
                                'No valid payment method available for this checkout.',
                                'payment_method_missing'
                            );
                        }
                        $paymentIntent = $integrationClient->createPaymentIntentForCheckout([
                            'order' => $order,
                            'items' => $items->toArray(),
                            'discounts' => $discounts,
                        ]);
                        Log::info('Payment intent after using existing card', [
                            'payment_intent_id' => $paymentIntent->id ?? null,
                            'payment_method' => $paymentIntent->payment_method ?? null,
                            'full_payment_intent' => json_encode($paymentIntent),
                        ]);
                        // Update payment method external_id if it is still temp_ and paymentIntent has a real payment method
                        if ($paymentIntent->payment_method && str_starts_with($existingPaymentMethod->external_id, 'temp_')) {
                            $existingPaymentMethod->update([
                                'external_id' => $paymentIntent->payment_method,
                            ]);
                            Log::info('Updated temp payment method external_id to real Stripe ID after using existing card', [
                                'payment_method_id' => $existingPaymentMethod->id,
                                'old_external_id' => $existingPaymentMethod->external_id,
                                'new_external_id' => $paymentIntent->payment_method,
                            ]);
                        }
                    } else {
                        // Use existing flow (requires saved payment method from setup intent)
                        $paymentIntent = $integrationClient->createPaymentIntentForCheckout([
                            'order' => $order,
                            'items' => $items->toArray(),
                            'discounts' => $discounts,
                        ]);
                    }

                    // Validate the one-time payment (only if not already validated in JIT flow)
                    if (!$paymentValidated && $paymentIntent) {
                        $validationResult = $this->paymentValidationService->validateOneTimePayment($paymentIntent);

                        logger()->info(logname('validation-result'), [
                            'result' => $validationResult,
                        ]);

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
                }
                // Handle other types of charges if needed
                else {
                    Log::warning('Unhandled charge type', [
                        'order_id' => $order->id,
                        'type' => $type,
                    ]);
                }
            });

            // Use database transaction to ensure atomicity and prevent race conditions
            \DB::transaction(function () use ($order, $checkoutSession, $integrationClient) {
                $order->refresh();
                if ($order->status === OrderStatus::COMPLETED) {
                    Log::warning('Order already completed within transaction', [
                        'order_id' => $order->id,
                        'checkout_session_id' => $checkoutSession->id,
                    ]);
                    return;
                }
                Log::info('Order marked as completed', [
                    'order_id' => $order->id,
                    'checkout_session_id' => $checkoutSession->id,
                ]);
                $order->markAsCompleted();
                $order->save();

                // Payment method is already created and associated during payment processing
                // No need to update external_id since we create with real Stripe IDs

                $this->handleOrderFulfillment($order);
            });

            return $order;
        } catch (PaymentException $e) {
            Log::error(logname('processing.payment-failure'), [
                'message' => $e->getMessage(),
                'order_id' => $order->id,
            ]);

            $checkoutSession->markAsFailed(true);
            throw $e;
        } catch (\Exception $e) {
            Log::error(logname('processing.failure'), [
                'message' => $e->getMessage(),
                'class' => get_class($e),
                'order_id' => $order->id,
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
     * Ensure customer exists for the order, creating one if necessary
     */
    private function ensureCustomerExists(
        Order $order,
        CheckoutSession $checkoutSession,
        ?string $confirmationToken,
        $integrationClient
    ): Customer {
        Log::info(logname('start'));
        // First, check if customer already exists on the order
        if ($order->customer) {
            return $order->customer;
        }

        // Check if customer exists on the checkout session
        if ($checkoutSession->customer) {
            Log::info(logname('checkout-existing-customer'), [
                'customer_id' => $checkoutSession->customer_id,
                'customer_email' => $checkoutSession->customer->email,
                'order_id' => $order->id,
                'checkout_session_id' => $checkoutSession->id,
            ]);
            $order->customer_id = $checkoutSession->customer->id;
            $order->save();

            return $checkoutSession->customer;
        }

        // If we have a confirmation token, extract customer info from it
        if ($confirmationToken && $integrationClient) {
            Log::info(logname('checking-confirm-token'));
            try {
                $stripeClient = $integrationClient->stripeClient ?? null;
                if ($stripeClient) {
                    $token = $stripeClient->confirmationTokens->retrieve($confirmationToken);
                    $billingDetails = $token->payment_method_preview->billing_details ?? null;

                    if ($billingDetails && $billingDetails->email) {
                        // Check if a customer with this email already exists for this organization
                        $existingCustomer = Customer::query()
                            ->where('organization_id', $order->organization_id)
                            ->where('email', $billingDetails->email)
                            ->first();

                        if ($existingCustomer) {
                            // Use existing customer
                            $order->customer_id = $existingCustomer->id;
                            $order->save();

                            $checkoutSession->customer_id = $existingCustomer->id;
                            $checkoutSession->save();

                            Log::info('Using existing customer with same email', [
                                'customer_id' => $existingCustomer->id,
                                'customer_email' => $existingCustomer->email,
                                'order_id' => $order->id,
                                'checkout_session_id' => $checkoutSession->id,
                            ]);

                            return $existingCustomer;
                        }

                        // Create customer in Stripe
                        $stripeCustomer = $integrationClient->createCustomer([
                            'email' => $billingDetails->email,
                            'name' => $billingDetails->name ?? null,
                        ]);

                        // Create customer in our database
                        $customer = Customer::create([
                            'organization_id' => $order->organization_id,
                            'integration_id' => $integrationClient->integration->id,
                            'reference_id' => $stripeCustomer->id,
                            'email' => $billingDetails->email,
                            'name' => $billingDetails->name ?? null,
                        ]);

                        // Associate customer with order and checkout session
                        $order->customer_id = $customer->id;
                        $order->save();

                        $checkoutSession->customer_id = $customer->id;
                        $checkoutSession->save();

                        Log::info('Created new customer from confirmation token', [
                            'customer_id' => $customer->id,
                            'customer_email' => $customer->email,
                            'stripe_customer_id' => $stripeCustomer->id,
                            'order_id' => $order->id,
                            'checkout_session_id' => $checkoutSession->id,
                        ]);

                        return $customer;
                    }
                }
            } catch (\Exception $e) {
                Log::warning(logname('fail'), [
                    'error' => $e->getMessage(),
                    'order_id' => $order->id,
                    'checkout_session_id' => $checkoutSession->id,
                ]);
            }
        }

        // If we still don't have a customer, we need to create one
        // This should not happen in normal flow since customers should be created during checkout
        throw new \Exception('Customer is required for payment processing. Please ensure customer information is provided during checkout.');
    }

    /**
     * Update customer email in both our database and Stripe
     */
    protected function updateCustomerEmail(Customer $customer, string $newEmail, $integrationClient): void
    {
        try {
            // Update in Stripe first
            if ($customer->reference_id) {
                $integrationClient->stripeClient->customers->update($customer->reference_id, [
                    'email' => $newEmail,
                ]);
            }

            // Update in our database
            $customer->update([
                'email' => $newEmail,
            ]);

            Log::info('Customer email updated', [
                'customer_id' => $customer->id,
                'old_email' => $customer->email,
                'new_email' => $newEmail,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update customer email', [
                'customer_id' => $customer->id,
                'new_email' => $newEmail,
                'error' => $e->getMessage(),
            ]);
            // Don't throw the exception - email update failure shouldn't fail the order
        }
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

    /**
     * Update payment method external_id if it's still temporary.
     */
    protected function updatePaymentMethodExternalId(CheckoutSession $checkoutSession, $integrationClient): void
    {
        if (!$checkoutSession->paymentMethod || !str_starts_with($checkoutSession->paymentMethod->external_id, 'temp_')) {
            return;
        }

        try {
            // Get the customer's default payment method from Stripe
            $customer = $checkoutSession->customer;
            if (!$customer || !$customer->reference_id) {
                Log::warning('Cannot update payment method - no customer or reference_id', [
                    'checkout_session_id' => $checkoutSession->id,
                    'customer_id' => $customer?->id,
                    'customer_reference_id' => $customer?->reference_id,
                ]);
                return;
            }

            $stripeCustomer = $integrationClient->stripeClient->customers->retrieve($customer->reference_id);
            $defaultPaymentMethod = $stripeCustomer->invoice_settings->default_payment_method ?? null;

            if ($defaultPaymentMethod) {
                $checkoutSession->paymentMethod->update([
                    'external_id' => $defaultPaymentMethod,
                ]);

                Log::info('🦆 Updated temporary payment method external_id with customer default', [
                    'payment_method_id' => $checkoutSession->paymentMethod->id,
                    'old_external_id' => $checkoutSession->paymentMethod->external_id,
                    'new_external_id' => $defaultPaymentMethod,
                    'customer_id' => $customer->id,
                ]);
            } else {
                Log::warning('🦆 Customer has no default payment method in Stripe', [
                    'customer_id' => $customer->id,
                    'stripe_customer_id' => $customer->reference_id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to update payment method external_id', [
                'error' => $e->getMessage(),
                'checkout_session_id' => $checkoutSession->id,
                'payment_method_id' => $checkoutSession->paymentMethod->id,
            ]);
        }
    }
}
