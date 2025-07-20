<?php

namespace App\Http\Controllers;

use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Enums\Theme\FontElement;
use App\Http\Resources\Checkout\CheckoutSessionResource;
use App\Http\Resources\FontResource;
use App\Http\Resources\OfferResource;
use App\Http\Resources\ThemeResource;
use App\Models\Checkout\CheckoutSession;
use App\Models\PaymentMethod;
use App\Models\Store\Offer;
use App\Models\Theme;
use App\Models\Catalog\Price;
use App\Traits\HandlesLandingPageDomains;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Support\Uri;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    use HandlesLandingPageDomains;

    public function __construct(
        private readonly CreateCheckoutSessionAction $createCheckoutSessionAction
    ) {}

    public function initialize(string $offerId, Request $request, string $environment = 'live')
    {
        $offer = Offer::retrieve($offerId);
        $checkoutItems = $request->get('items', []);

        if (!empty($checkoutItems)) {
            foreach ($checkoutItems as $key => $item) {
                if (!isset($item['lookup_key'])) {
                    throw ValidationException::withMessages([
                        'items' => ['Each item must have a lookup_key'],
                    ]);
                }

                $price = Price::query()
                    ->where('organization_id', $offer->organization_id)
                    ->where('lookup_key', $item['lookup_key'])
                    ->where('is_active', true)
                    ->first();

                if ($price) {
                    $checkoutItems[$key]['price_id'] = $price->id;
                } else {
                    return [
                        'items' => ["Price with lookup_key '{$item['lookup_key']}' not found"],
                    ];
                }
            }
        }

        $testMode = $environment === 'test';

        $checkoutSession = $this->createCheckoutSessionAction->execute($offer, $checkoutItems, $testMode);
        $this->handleInvalidDomain($request, $checkoutSession);

        $params = array_filter(array_merge([
            'checkout' => $checkoutSession->getRouteKey(),
        ], $request->only(['numi-embed-id', 'numi-embed-type'])));

        if ($request->has('redirect_url')) {
            $params['redirect_url'] = $request->get('redirect_url');
        }

        return redirect()
            ->to(URL::signedRoute('checkouts.show', $params, now()->addDays(5)));
    }

    public function show(CheckoutSession $checkout, Request $request)
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired checkout link.');
        }

        $this->handleInvalidDomain($request, $checkout);

        if ($checkout->hasACompletedOrder()) {
            return redirect()
                ->to(URL::signedRoute('order-status.show', ['order' => $checkout->order], now()->addDays(30)));
        }

        $checkout->load([
            'lineItems.offerItem.offerPrices',
            'offer.theme',
            'offer.organization.logoMedia',
            'offer.socialImage',
            'offer.organization.faviconMedia',
            'offer.hostedPage.logoImage',
            'offer.hostedPage.backgroundImage',
            'lineItems.price.integration',
            'lineItems.price.product',
            'organization.integrations',
            'paymentMethod',
            'customer'
        ]);

        $offer = $checkout->offer;
        $json = $offer->view;

        /**
         * @todo Replace with the actual view json
         */
        $json['first_page'] = data_get($checkout->metadata, 'current_page_id', $json['first_page']);
        $json['page_history'] = data_get($checkout->metadata, 'page_history', []);
        $offer->view = $json;

        return Inertia::render('checkout', [
            'fonts' => FontResource::collection(FontElement::cases()),
            'offer' => new OfferResource($offer),
            'checkoutSession' => new CheckoutSessionResource($checkout),
        ]);
    }

    /**
     * Handle redirect returns from payment methods like Klarna
     * This handles both popup and direct redirect scenarios
     */
    public function callback(CheckoutSession $session, Request $request)
    {
        // JIT: Handle redirect returns from payment methods like Klarna
        $paymentIntentId = $request->query('payment_intent');
        $setupIntentId = $request->query('setup_intent');
        $redirectStatus = $request->query('redirect_status');
        $sessionId = $request->query('session_id');



        // Update checkout with redirect metadata
        $session->update([
            'metadata' => array_merge($session->metadata ?? [], [
                'redirect_return_at' => now()->toISOString(),
                'redirect_status' => $redirectStatus,
                'redirect_params' => $request->all(),
            ])
        ]);

        // we actually need to postmessage out so we can get the sdk to handle the redirects
        //

        // redirect to the current url
        // append a fragment like #numi-continue-token={}
        // swap a continue token for a cart?
        // how do we know wht started it? how do we know it was a popup?

        // Check if payment was successful
        if ($redirectStatus !== 'succeeded') {
            Log::warning('JIT: Redirect payment failed or cancelled', [
                'checkout_session_id' => $session->id,
                'redirect_status' => $redirectStatus,
            ]);

            // Get the current_url from checkout metadata for fallback
            $currentUrl = Uri::of($session->metadata['current_url'] ?? '');

            dd($uri);


            if ($currentUrl) {
                // Redirect back to the original checkout page with error
                return redirect()->away($currentUrl . '?numi-state=payment_failed&reason=' . urlencode($redirectStatus));
            } else {
                // Fallback to signed checkout URL with error state
                $signedUrl = URL::signedRoute('checkouts.show', ['checkout' => $session->getRouteKey()], now()->addDays(5));
                return redirect()->away($signedUrl . '&numi-state=payment_failed&reason=' . urlencode($redirectStatus));
            }
        }

        if ($session->return_url) {
            dd('big return!');
        }

        $intent = $session->paymentsIntegration
            ->integrationClient()
            ->getStripeClient()
            ->paymentIntents
            ->retrieve($session->intent_id, [
                'expand' => ['payment_method', 'latest_charge'],
            ]);

        // OR, confirm it?
        $paymentMethod = PaymentMethod::query()
            ->firstOrCreate([
                'customer_id' => $session->customer_id,
                'organization_id' => $session->organization_id,
                'integration_id' => $session->payments_integration_id,
                'external_id' => $intent->payment_method->id,
            ], [
                'type' => $intent->payment_method->type,
                'properties' => $intent->payment_method->{$intent->payment_method},
                'metadata' => $intent->payment_method->metadata,
                'can_redisplay' => $intent->payment_method->allow_redisplay !== 'limited',
                'billing_details' => $intent->payment_method->billing_details->toArray(),
            ]);
        $session->payment_method_id = $paymentMethod->id;

        $session->update([
            'payment_confirmed_at' => now(),
            'payment_method_locked' => true,
            'metadata' => array_merge($session->metadata ?? [], [
                'redirect_completed_at' => now()->toISOString(),
                'redirect_status' => $redirectStatus,
            ]),
        ]);

        return redirect()->signedRoute('checkouts.show', [$session]);

        // Get the current_url from checkout metadata for fallback
//        $currentUrl = $session->metadata['current_url'] ?? null;
//
//        if ($currentUrl) {
//            return redirect()
//                ->away($currentUrl . '?numi-state=processing_failed&message=' . urlencode('Payment was successful but order processing failed. Please contact support.'));
//        } else {
//            // Fallback to signed checkout URL with error state
//            $signedUrl = URL::signedRoute('checkouts.show', ['checkout' => $session->getRouteKey()], now()->addDays(5));
//
//            return redirect()
//                ->away($signedUrl . '&numi-state=processing_failed&message=' . urlencode('Payment was successful but order processing failed. Please contact support.'));
//        }

        // Determine the appropriate redirect based on context
        $currentUrl = $session->metadata['current_url'] ?? null;
        $isPopup = $request->query('numi-embed-type') === 'popup' ||
                   $request->query('numi-embed-id') ||
                   $session->metadata['is_popup'] ?? false;

        if ($isPopup && $currentUrl) {
            // For popup scenarios, redirect back to the original page with success state
            // This allows the parent window to handle the success and close the popup
            $successUrl = $currentUrl . '?numi-state=payment_completed&checkout_id=' . $session->getRouteKey();

            \Log::info('JIT: Redirecting popup to parent with success state', [
                'checkout_session_id' => $session->id,
                'success_url' => $successUrl,
            ]);

            return redirect()->away($successUrl);
        } else {
            // For direct redirects, go to the success page or return URL
            $returnUrl = $session->return_url
                ?: URL::signedRoute('order-status.show', ['order' => $session->order->uuid], now()->addDays(30));

            \Log::info('JIT: Redirecting to success page', [
                'checkout_session_id' => $session->id,
                'return_url' => $returnUrl,
            ]);

            return redirect()->away($returnUrl);
        }
    }

    /**
     * JIT: Prepare payment by creating the appropriate Stripe intent just-in-time
     * This is called by the frontend after validating payment details
     */
    public function preparePayment(CheckoutSession $checkout, Request $request)
    {
        // Validate the request
        $request->validate([
            'action' => 'required|string|in:prepare_payment',
            'email' => 'required|email',
            'payment_type' => 'nullable|string',
            'current_url' => 'nullable|url',
        ]);

        // Check if checkout is already completed
        if ($checkout->status === \App\Enums\CheckoutSessionStatus::CLOSED) {
            return response()->json([
                'error' => 'Checkout session is already completed',
                'code' => 'checkout_completed'
            ], 400);
        }

        // Check if payment is already confirmed
        if ($checkout->payment_confirmed_at) {
            return response()->json([
                'error' => 'Payment is already confirmed',
                'code' => 'payment_confirmed'
            ], 400);
        }

        try {
            // Update checkout with email if provided
            if ($request->email) {
                $checkout->update([
                    'properties' => array_merge($checkout->properties ?? [], [
                        'email' => $request->email
                    ])
                ]);
            }

            // Create or get customer for this email
            $customer = $this->findOrCreateCustomer($checkout, $request->email);

            // Check if we already have an intent that we can reuse
            $shouldCreateNewIntent = true;

            if ($checkout->intent_id && $checkout->client_secret) {
                // Check if the payment type has changed significantly (e.g., from card to Klarna)
                $paymentType = $request->input('payment_type');
                $currentPaymentType = $checkout->metadata['payment_type'] ?? null;

                \Log::info('JIT: Checking payment type for intent reuse', [
                    'checkout_session_id' => $checkout->id,
                    'current_payment_type' => $currentPaymentType,
                    'new_payment_type' => $paymentType,
                    'types_match' => $paymentType === $currentPaymentType,
                    'current_payment_type_length' => strlen($currentPaymentType ?? ''),
                    'new_payment_type_length' => strlen($paymentType ?? ''),
                ]);

                // If payment type hasn't changed, reuse the existing intent
                if ($paymentType === $currentPaymentType) {
                    \Log::info('JIT: Reusing existing intent', [
                        'checkout_session_id' => $checkout->id,
                        'intent_id' => $checkout->intent_id,
                        'intent_type' => $checkout->intent_type,
                        'payment_type' => $paymentType,
                    ]);

                    // Determine if this is a redirect-based payment method
                    $currentUrl = $request->input('current_url');

                    $redirectMethods = [
                        'klarna', 'afterpay_clearpay', 'affirm', 'ideal', 'sofort', 'bancontact',
                        'giropay', 'eps', 'p24', 'alipay', 'wechat_pay', 'fpx', 'grabpay',
                        'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay', 'zip', 'swish',
                        'twint', 'mb_way', 'multibanco', 'blik', 'mobilepay', 'vipps', 'satispay'
                    ];

                    $isRedirectMethod = $paymentType && in_array($paymentType, $redirectMethods);

                    $response = [
                        'client_secret' => $checkout->client_secret,
                        'intent_type' => $checkout->intent_type,
                        'requires_action' => false,
                        'checkout_id' => $checkout->getRouteKey(),
                    ];

                    // Always provide return_url - Stripe requires it for all payment confirmations
                    if ($isRedirectMethod) {
                        $response['return_url'] = route('checkout.redirect.callback', [
                            'checkout' => $checkout->getRouteKey()
                        ]);
                        $response['is_redirect_method'] = true;
                    } else {
                        $response['return_url'] = $currentUrl;
                        $response['is_redirect_method'] = false;
                    }

                    // Update the selected payment method even when reusing intent
                    $checkout->update([
                        'metadata' => array_merge($checkout->metadata ?? [], [
                            'selected_payment_method' => $paymentType,
                            'payment_method_selected_at' => now()->toISOString(),
                            'is_popup' => $request->query('numi-embed-type') === 'popup' || $request->query('numi-embed-id'),
                            'embed_type' => $request->query('numi-embed-type'),
                            'embed_id' => $request->query('numi-embed-id'),
                        ])
                    ]);

                    return response()->json($response);
                } else {
                    // Payment type has changed, we need to create a new intent
                    \Log::info('JIT: Payment type changed, creating new intent', [
                        'checkout_session_id' => $checkout->id,
                        'old_payment_type' => $currentPaymentType,
                        'new_payment_type' => $paymentType,
                    ]);

                    // Clear the existing intent data
                    $checkout->update([
                        'intent_id' => null,
                        'intent_type' => null,
                        'client_secret' => null,
                        'metadata' => array_merge($checkout->metadata ?? [], [
                            'intent_cleared_at' => now()->toISOString(),
                            'cleared_reason' => 'payment_type_changed',
                        ])
                    ]);

                    // Refresh the checkout object to get the updated values
                    $checkout->refresh();
                }
            }

            // Determine intent mode based on cart contents
            $intentMode = $this->determineIntentMode($checkout);

            \Log::info('JIT: Creating new Stripe intent', [
                'checkout_session_id' => $checkout->id,
                'intent_mode' => $intentMode,
                'payment_type' => $request->input('payment_type'),
                'has_existing_intent' => !empty($checkout->intent_id),
            ]);

            // Create the appropriate Stripe intent
            $intentResult = $this->createStripeIntent($checkout, $customer, $intentMode);

            // Determine if this is a redirect-based payment method
            $paymentType = $request->input('payment_type');
            $currentUrl = $request->input('current_url');

            $redirectMethods = [
                'klarna', 'afterpay_clearpay', 'affirm', 'ideal', 'sofort', 'bancontact',
                'giropay', 'eps', 'p24', 'alipay', 'wechat_pay', 'fpx', 'grabpay',
                'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay', 'zip', 'swish',
                'twint', 'mb_way', 'multibanco', 'blik', 'mobilepay', 'vipps', 'satispay'
            ];

            $isRedirectMethod = $paymentType && in_array($paymentType, $redirectMethods);

            // Update checkout with intent details and current_url
            $checkout->update([
                'intent_id' => $intentResult['intent_id'],
                'intent_type' => $intentResult['intent_type'],
                'client_secret' => $intentResult['client_secret'],
                'customer_id' => $customer?->id,
                'metadata' => array_merge($checkout->metadata ?? [], [
                    'jit_created_at' => now()->toISOString(),
                    'intent_mode' => $intentMode,
                    'current_url' => $currentUrl,
                    'payment_type' => $paymentType,
                    'is_redirect_method' => $isRedirectMethod,
                    'selected_payment_method' => $paymentType, // Remember the selected payment method
                    'payment_method_selected_at' => now()->toISOString(),
                    'is_popup' => $request->query('numi-embed-type') === 'popup' || $request->query('numi-embed-id'),
                    'embed_type' => $request->query('numi-embed-type'),
                    'embed_id' => $request->query('numi-embed-id'),
                ])
            ]);

            $response = [
                'client_secret' => $intentResult['client_secret'],
                'intent_type' => $intentResult['intent_type'],
                'requires_action' => $intentResult['requires_action'] ?? false,
                'checkout_id' => $checkout->getRouteKey(),
            ];

            // Always provide return_url - Stripe requires it for all payment confirmations
            // For redirect methods, use the redirect return route
            // For card payments, use the current URL as fallback for 3D Secure etc.
            if ($isRedirectMethod) {
                $response['return_url'] = route('checkout.redirect.callback', [
                    'checkout' => $checkout->getRouteKey()
                ]);
                $response['is_redirect_method'] = true;

                \Log::info('JIT: Prepared redirect payment', [
                    'checkout_session_id' => $checkout->id,
                    'payment_type' => $paymentType,
                    'return_url' => $response['return_url'],
                    'intent_type' => $intentResult['intent_type'],
                ]);
            } else {
                // For card payments, use current URL as return_url for 3D Secure etc.
                $response['return_url'] = $currentUrl;
                $response['is_redirect_method'] = false;

                \Log::info('JIT: Prepared immediate payment', [
                    'checkout_session_id' => $checkout->id,
                    'payment_type' => $paymentType,
                    'return_url' => $response['return_url'],
                    'intent_type' => $intentResult['intent_type'],
                ]);
            }

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Failed to prepare payment', [
                'checkout_session_id' => $checkout->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Handle idempotency key conflicts specifically
            if (str_contains($e->getMessage(), 'Keys for idempotent requests can only be used with the same parameters')) {
                \Log::warning('Idempotency key conflict detected, this is expected when parameters change', [
                    'checkout_session_id' => $checkout->id,
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'error' => 'Payment parameters have changed. Please try again.',
                    'code' => 'idempotency_conflict',
                    'retry_allowed' => true,
                ], 409); // Use 409 Conflict status code
            }

            // Return full error details for debugging
            return response()->json([
                'error' => 'Failed to prepare payment: ' . $e->getMessage(),
                'code' => 'prepare_payment_failed',
                'debug' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                    'checkout_session_id' => $checkout->id,
                ]
            ], 500);
        }
    }

    /**
     * Determine the intent mode based on cart contents
     */
    private function determineIntentMode(CheckoutSession $checkout): string
    {
        // Check if any line items are subscriptions
        $hasSubscriptionItems = $checkout->lineItems()
            ->whereHas('price', function ($query) {
                $query->where('type', 'recurring');
            })
            ->exists();

        // Check if any line items are one-time
        $hasOneTimeItems = $checkout->lineItems()
            ->whereHas('price', function ($query) {
                $query->where('type', 'one_time');
            })
            ->exists();

        // Update checkout metadata for frontend intelligence
        $checkout->update([
            'metadata' => array_merge($checkout->metadata ?? [], [
                'has_subscription_items' => $hasSubscriptionItems,
                'has_onetime_items' => $hasOneTimeItems,
                'has_mixed_cart' => $hasSubscriptionItems && $hasOneTimeItems,
            ])
        ]);

        // Return appropriate mode
        if ($hasSubscriptionItems) {
            return 'setup'; // For subscriptions, we need setup intent
        } else {
            return 'payment'; // For one-time payments
        }
    }

    /**
     * Find or create customer for the given email
     */
    private function findOrCreateCustomer(CheckoutSession $checkout, string $email): ?\App\Models\Customer
    {
        // First, try to find existing customer by email
        $customer = \App\Models\Customer::where('email', $email)
            ->where('organization_id', $checkout->organization_id)
            ->first();

        if ($customer) {
            return $customer;
        }

        // Create new customer if not found
        $customer = \App\Models\Customer::create([
            'organization_id' => $checkout->organization_id,
            'email' => $email,
            'properties' => [
                'created_via' => 'checkout',
                'checkout_session_id' => $checkout->getRouteKey(),
            ]
        ]);

        return $customer;
    }

    /**
     * Create the appropriate Stripe intent based on cart contents
     */
    private function createStripeIntent(CheckoutSession $checkout, ?\App\Models\Customer $customer, string $intentMode): array
    {
        $integrationClient = $checkout->integrationClient();

        if ($intentMode === 'payment') {
            return $this->createPaymentIntent($integrationClient, $checkout, $customer);
        } else {
            return $this->createSetupIntent($integrationClient, $checkout, $customer);
        }
    }

    /**
     * Create a PaymentIntent for one-time payments
     */
    private function createPaymentIntent($integrationClient, CheckoutSession $checkout, ?\App\Models\Customer $customer): array
    {
        // Get filtered payment methods for this context
        $paymentMethods = $this->getFilteredPaymentMethods($checkout, 'payment');

        $intent = $integrationClient->createPaymentIntent([
            'checkout_session' => $checkout,
            'amount' => $checkout->total,
            'currency' => $checkout->currency,
            'customer' => $customer?->reference_id,
            'metadata' => [
                'checkout_session_id' => $checkout->getRouteKey(),
                'jit_created' => true,
            ],
            'payment_method_types' => $paymentMethods,
            'setup_future_usage' => 'off_session', // Save payment method for future use
        ]);

        return [
            'intent_id' => $intent->id,
            'intent_type' => 'payment',
            'client_secret' => $intent->client_secret,
        ];
    }

    /**
     * Create a SetupIntent for subscriptions
     */
    private function createSetupIntent($integrationClient, CheckoutSession $checkout, ?\App\Models\Customer $customer): array
    {
        // Get filtered payment methods for this context
        $paymentMethods = $this->getFilteredPaymentMethods($checkout, 'setup');

        $intent = $integrationClient->createSetupIntent($checkout, null, [
            'customer' => $customer?->reference_id,
            'metadata' => [
                'checkout_session_id' => $checkout->getRouteKey(),
                'jit_created' => true,
            ],
            'payment_method_types' => $paymentMethods,
            'usage' => 'off_session',
        ]);

        return [
            'intent_id' => $intent->id,
            'intent_type' => 'setup',
            'client_secret' => $intent->client_secret,
        ];
    }

    /**
     * Get filtered payment methods based on checkout context
     * This implements the same logic as the frontend PaymentIntelligenceService
     */
    private function getFilteredPaymentMethods(CheckoutSession $checkout, string $intentMode): array
    {
        $enabledMethods = $checkout->enabled_payment_methods ?? ['card'];

        // Filter out non-recurring methods for subscription mode
        if ($intentMode === 'setup') {
            $nonRecurringMethods = [
                'klarna', 'afterpay_clearpay', 'affirm', 'zip', 'alipay', 'wechat_pay',
                'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay'
            ];

            $enabledMethods = array_filter($enabledMethods, function ($method) use ($nonRecurringMethods) {
                return !in_array($method, $nonRecurringMethods);
            });
        }

        // Apply amount limits for payment mode
        if ($intentMode === 'payment' && $checkout->total > 0) {
            $enabledMethods = $this->filterByAmountLimits($enabledMethods, $checkout->total, $checkout->currency);
        }

        // Ensure we have at least card as fallback
        if (empty($enabledMethods)) {
            $enabledMethods = ['card'];
        }

        return array_values($enabledMethods);
    }

    /**
     * Filter payment methods by amount limits (same logic as frontend)
     */
    private function filterByAmountLimits(array $methods, int $totalInCents, string $currency): array
    {
        $limits = [
            'afterpay_clearpay' => [
                'usd' => 200000, 'cad' => 250000, 'aud' => 300000,
                'nzd' => 300000, 'gbp' => 150000, 'eur' => 180000
            ],
            'affirm' => [ 'usd' => 175000, 'cad' => 200000 ],
            'klarna' => [
                'usd' => 100000, 'eur' => 100000, 'gbp' => 80000,
                'aud' => 150000, 'cad' => 120000
            ],
            'zip' => [ 'usd' => 100000, 'aud' => 150000 ]
        ];

        $currencyLower = strtolower($currency);

        return array_filter($methods, function ($method) use ($limits, $totalInCents, $currencyLower) {
            if (!isset($limits[$method])) {
                return true; // No limits for this method
            }

            $methodLimits = $limits[$method];
            if (!isset($methodLimits[$currencyLower])) {
                return true; // No limit for this currency
            }

            $limit = $methodLimits[$currencyLower];
            return $totalInCents <= $limit;
        });
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
