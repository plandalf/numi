<?php

namespace App\Http\Controllers;

use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Enums\Theme\FontElement;
use App\Http\Resources\Checkout\CheckoutSessionResource;
use App\Http\Resources\FontResource;
use App\Http\Resources\OfferResource;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\PaymentMethod;
use App\Models\Store\Offer;
use App\Services\FontExtractionService;
use App\Traits\HandlesLandingPageDomains;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use App\Models\ApiKey;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class CheckoutController extends Controller
{
    use HandlesLandingPageDomains;

    public function __construct(
        private readonly CreateCheckoutSessionAction $createCheckoutSessionAction,
        private readonly FontExtractionService $fontExtractionService
    ) {}

    public function initialize(Offer $offer, Request $request, string $environment = 'live')
    {
        $offer->load('organization');
        $checkoutItems = $request->get('items', []);

        // Accept 'price' shortcut as primary item (lookup_key)
        $primaryPriceLookup = $request->query('price');
        if ($primaryPriceLookup && empty($checkoutItems)) {
            $checkoutItems = [['lookup_key' => $primaryPriceLookup]];
        }

        // Get override parameters from query string
        $intervalOverride = $request->query('interval');
        $currencyOverride = $request->query('currency');

        // Extract customer data from query string or JWT token
        $rawCustomerParam = $request->query('customer');
        $customerProperties = [];
        $jwtStripeCustomerId = null;
        $jwtUserId = null;
        $jwtGroupId = null;

        if (is_string($rawCustomerParam) && substr_count($rawCustomerParam, '.') === 2) {
            try {
                [$apiKey, $payload] = $this->decodeCustomerToken($rawCustomerParam);
                // Accept canonical fields from payload
                $email = data_get($payload, 'email');
                $name = data_get($payload, 'name');
                $phone = data_get($payload, 'phone');
                $company = data_get($payload, 'company');
                $jwtStripeCustomerId = data_get($payload, 'customer_id') ?? data_get($payload, 'id');
                $jwtUserId = data_get($payload, 'sub');
                $jwtGroupId = data_get($payload, 'grp');

                if ($email) { $customerProperties['email'] = $email; }
                if ($name) { $customerProperties['name'] = $name; }
                if ($phone) { $customerProperties['phone'] = $phone; }
                if ($company) { $customerProperties['company'] = $company; }
            } catch (\Throwable $e) {
                Log::warning('Invalid checkout customer token', ['error' => $e->getMessage()]);
            }
        } else {
            $customerData = $request->query('customer', []);
            if (is_array($customerData) && ! empty($customerData)) {
                if (isset($customerData['email'])) {
                    $customerProperties['email'] = $customerData['email'];
                }
                foreach (['name', 'phone', 'company'] as $field) {
                    if (isset($customerData[$field])) {
                        $customerProperties[$field] = $customerData[$field];
                    }
                }
            }
        }

        // If no currency override is provided, check for regional currency based on CloudFlare header
        if (! $currencyOverride) {
            $countryCode = $request->header('CF-IPCountry');
            $regionalCurrency = $offer->organization->getRegionalCurrency($countryCode);
            if ($regionalCurrency) {
                $currencyOverride = strtolower($regionalCurrency);
            }
        }

        // Process any explicit checkout items from query string
        $checkoutItems = collect(Arr::wrap($checkoutItems))
            ->map(function ($item, $key) use ($offer) {
                if (! isset($item['lookup_key'])) {
                    throw ValidationException::withMessages([
                        'items' => ['Each item must have a lookup_key'],
                    ]);
                }

                $price = Price::query()
                    ->where('organization_id', $offer->organization_id)
                    ->where('lookup_key', $item['lookup_key'])
                    ->where('is_active', true)
                    ->first();

                if (! $price) {
                    return [
                        'items' => ["Price with lookup_key '{$item['lookup_key']}' not found"],
                    ];
                }

                return ['price_id' => $price->id];
            })
            ->all();

        // Check for any errors in the checkout items
        foreach ($checkoutItems as $item) {
            if (isset($item['items'])) {
                // This is an error, return it as JSON response
                return response()->json($item);
            }
        }

        $testMode = $environment === 'test';

        // If no explicit interval override provided, derive from primary price if available
        if (! $intervalOverride && $primaryPriceLookup) {
            $primaryPrice = Price::query()
                ->where('organization_id', $offer->organization_id)
                ->where('lookup_key', $primaryPriceLookup)
                ->where('is_active', true)
                ->first();

            if ($primaryPrice && $primaryPrice->renew_interval) {
                $intervalOverride = strtolower($primaryPrice->renew_interval);
            }
        }

        // New: handle intent and subscription for upgrades
        $intent = $request->query('intent', 'purchase');
        $subscription = $intent === 'upgrade' ? $request->query('subscription') : null;
        $quantity = $request->query('quantity'); // Handle quantity for expansion scenarios

        $checkoutSession = $this->createCheckoutSessionAction
            ->execute(
                $offer,
                $checkoutItems,
                $testMode,
                $intervalOverride,
                $currencyOverride,
                $customerProperties,
                $intent,
                $subscription,
                $quantity // Pass quantity to the action
            );

        // If a JWT provided a Stripe customer id, associate or create a local Customer and link to session
        if ($jwtStripeCustomerId) {
            try {
                $integrationId = $checkoutSession->payments_integration_id;
                if ($integrationId) {
                    $localCustomer = \App\Models\Customer::query()->firstOrCreate([
                        'organization_id' => $offer->organization_id,
                        'integration_id' => $integrationId,
                        'reference_id' => (string) $jwtStripeCustomerId,
                    ], [
                        'email' => $customerProperties['email'] ?? null,
                        'name' => $customerProperties['name'] ?? null,
                    ]);

                    $checkoutSession->customer_id = $localCustomer->id;
                    // Persist JWT claims for later use
                    $checkoutSession->metadata = array_merge($checkoutSession->metadata ?? [], [
                        'jwt' => array_filter([
                            'sub' => $jwtUserId,
                            'grp' => $jwtGroupId,
                            'customer_id' => $jwtStripeCustomerId,
                        ], fn ($v) => ! is_null($v)),
                    ]);
                    $checkoutSession->save();
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to associate JWT customer to checkout', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->handleInvalidDomain($request, $checkoutSession);

        $params = array_filter(array_merge([
            'checkout' => $checkoutSession->getRouteKey(),
        ], $request->only(['embed-id', 'embed-type', 'numi-embed-type', 'numi-embed-id', 'numi-embed-parent-page'])));

        if ($request->has('redirect_url')) {
            $params['redirect_url'] = $request->get('redirect_url');
        }

        $signedShowUrl = URL::signedRoute('checkouts.show', $params, now()->addDays(5));

        // extremely stupid here.

        // Derive a simple selected_option (e.g., 'sm'|'md') based on chosen product name if available
        $checkoutSession->loadMissing(['lineItems.price.product']);
 
        $checkoutSession->load([
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
            'customer',
        ]);

        $offer = $checkoutSession->offer;
        $json = $offer->view;

        // Sync initial page state from checkout metadata
        $json['first_page'] = data_get($checkoutSession->metadata, 'current_page_id', $json['first_page']);
        $json['page_history'] = data_get($checkoutSession->metadata, 'page_history', []);
        $offer->view = $json;

        // Extract fonts for preloading
        $customFonts = $this->fontExtractionService->extractAllFontsForOffer($offer);
        $googleFontsUrl = $this->fontExtractionService->buildGoogleFontsUrl($customFonts);

        return Inertia::render('client/checkout', [
            'fonts' => FontResource::collection(FontElement::cases()),
            'offer' => new OfferResource($offer),
            'checkoutSession' => new CheckoutSessionResource($checkoutSession),
            'subscriptionPreview' => Inertia::defer(function () use ($checkoutSession) {
                return app(\App\Actions\Checkout\PreviewSubscriptionChangeAction::class)($checkoutSession);
            }),
            // List locally saved payment methods (cards) for selection in checkout UI
            'savedPaymentMethods' => Inertia::defer(function () use ($checkoutSession) {
                try {
                    $customer = $checkoutSession->customer;
                    if (! $customer) {
                        return [];
                    }
                    $defaultLocalId = $customer->default_payment_method_id;
                    $methods = PaymentMethod::query()
                        ->where('customer_id', $customer->id)
                        ->orderByDesc('id')
                        ->get();

                    return $methods->map(function (PaymentMethod $pm) use ($defaultLocalId) {
                        $props = $pm->properties ?? [];
                        $card = is_array($props) ? ($props['card'] ?? []) : [];
                        $brand = data_get($card, 'display_brand')
                            ?? data_get($card, 'brand')
                            ?? data_get($props, 'display_brand')
                            ?? data_get($props, 'brand');
                        $last4 = data_get($card, 'last4') ?? data_get($props, 'last4');
                        $expMonth = data_get($card, 'exp_month') ?? data_get($props, 'exp_month');
                        $expYear = data_get($card, 'exp_year') ?? data_get($props, 'exp_year');
                        $exp = null;
                        if ($expMonth !== null && $expYear !== null) {
                            $exp = sprintf('%02d/%02d', (int) $expMonth, ((int) $expYear) % 100);
                        }
                        return [
                            // Use external_id (Stripe PM id) so we can set default in Stripe when chosen
                            'id' => $pm->external_id,
                            'type' => $pm->type,
                            'properties' => $pm->properties,
                            'brand' => $brand,
                            'last4' => $last4,
                            'exp' => $exp,
                            'isDefault' => $pm->id === $defaultLocalId,
                        ];
                    })->all();
                } catch (\Throwable $e) {
                    Log::warning('Local saved payment methods fetch failed', ['error' => $e->getMessage()]);
                    return [];
                }
            }),
            // Provide the canonical signed /checkout URL for a JSON-only replace on mount
            'signedShowUrl' => $signedShowUrl,
        ])->with([
            'customFonts' => $customFonts,
            'googleFontsUrl' => $googleFontsUrl,
        ]);
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
            'customer',
        ]);

        $offer = $checkout->offer;
        $json = $offer->view;

        /**
         * @todo Replace with the actual view json
         */
        $json['first_page'] = data_get($checkout->metadata, 'current_page_id', $json['first_page']);
        $json['page_history'] = data_get($checkout->metadata, 'page_history', []);
        $offer->view = $json;

        // Extract fonts for preloading
        $customFonts = $this->fontExtractionService->extractAllFontsForOffer($offer);
        $googleFontsUrl = $this->fontExtractionService->buildGoogleFontsUrl($customFonts);

        return Inertia::render('client/checkout', [
            'fonts' => FontResource::collection(FontElement::cases()),
            'offer' => new OfferResource($offer),

            // calculation ?
            'checkoutSession' => new CheckoutSessionResource($checkout),

            // Deferred preview for subscription upgrade/swap deltas
            'subscriptionPreview' => Inertia::defer(function () use ($checkout) {
                return app(\App\Actions\Checkout\PreviewSubscriptionChangeAction::class)($checkout);
            }),
            // Also provide saved payment methods on the canonical show route
            'savedPaymentMethods' => Inertia::defer(function () use ($checkout) {
                try {
                    $customer = $checkout->customer;
                    if (! $customer) {
                        return [];
                    }
                    $defaultLocalId = $customer->default_payment_method_id;
                    $methods = PaymentMethod::query()
                        ->where('customer_id', $customer->id)
                        ->orderByDesc('id')
                        ->get();

                    return $methods->map(function (PaymentMethod $pm) use ($defaultLocalId) {
                        return [
                            'id' => $pm->external_id,
                            'type' => $pm->type,
                            'properties' => $pm->properties,
                            'brand' => data_get($pm->properties, 'card.brand'),
                            'last4' => data_get($pm->properties, 'card.last4'),
                            'exp' => sprintf('%02d/%02d', (int) data_get($pm->properties, 'card.exp_month'), ((int) data_get($pm->properties, 'card.exp_year')) % 100),
                            'isDefault' => $pm->id === $defaultLocalId,
                        ];
                    })->all();
                } catch (\Throwable $e) {
                    Log::warning('Local saved payment methods fetch failed (show)', ['error' => $e->getMessage()]);
                    return [];
                }
            }),
        ])->with([
            'customFonts' => $customFonts,
            'googleFontsUrl' => $googleFontsUrl,
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

        // ? setup_intent=seti_1RnPRbFmvUKqVS2HaScBgV8o
        // & setup_intent_client_secret=seti_1RnPRbFmvUKqVS2HaScBgV8o_secret_Sir9YRUPn3vjLQKzh0tTh8V0l7ibMDL
        // & redirect_status=succeeded
        // Update checkout with redirect metadata

        $session->update([
            'metadata' => array_merge($session->metadata ?? [], [
                'redirect_return_at' => now()->toISOString(),
                'redirect_status' => $redirectStatus,
                'redirect_params' => $request->all(),
            ]),
        ]);

        if ($redirectStatus === 'failed') {
            return redirect()->signedRoute('checkouts.show', [
                'checkout' => $session,
                'next_action' => 'retry',
            ]);
        }

        // Check if payment was successful
        if ($redirectStatus !== 'succeeded') {

            return redirect()->signedRoute('checkouts.show', [
                'checkout' => $session,
                'next_action' => 'confirm_automatically',
            ]);

            if ($currentUrl) {
                // Redirect back to the original checkout page with error
                return redirect()->away($currentUrl.'?numi-state=payment_failed&reason='.urlencode($redirectStatus));
            } else {
                // Fallback to signed checkout URL with error state
                $signedUrl = URL::signedRoute('checkouts.show', ['checkout' => $session->getRouteKey()], now()->addDays(5));

                return redirect()->away($signedUrl.'&numi-state=payment_failed&reason='.urlencode($redirectStatus));
            }
        }

        if ($session->intent_type === 'setup') {
            $intent = $session->paymentsIntegration
                ->integrationClient()
                ->getStripeClient()
                ->setupIntents
                ->retrieve($session->intent_id, [
                    'expand' => ['payment_method'],
                ]);
        } else {

            $intent = $session->paymentsIntegration
                ->integrationClient()
                ->getStripeClient()
                ->paymentIntents
                ->retrieve($session->intent_id, [
                    'expand' => ['payment_method', 'latest_charge'],
                ]);
        }

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

        //        return redirect()->signedRoute('checkouts.show', [$session]);
        return redirect()->signedRoute('checkouts.show', [
            'checkout' => $session,
            'next_action' => 'confirm_automatically',
        ]);

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
        $isPopup = $request->query('embed-type') === 'popup' ||
                   $request->query('embed-id') ||
                   $session->metadata['is_popup'] ?? false;

        if ($isPopup && $currentUrl) {
            // For popup scenarios, redirect back to the original page with success state
            // This allows the parent window to handle the success and close the popup
            $successUrl = $currentUrl.'?state=payment_completed&checkout_id='.$session->getRouteKey();

            return redirect()->away($successUrl);
        } else {
            // For direct redirects, go to the success page or return URL
            $returnUrl = $session->return_url
                ?: URL::signedRoute('order-status.show', ['order' => $session->order->uuid], now()->addDays(30));

            return redirect()->away($returnUrl);
        }
    }

    /**
     * Find a child price that matches the given interval and/or currency overrides
     */
    private function findChildPriceWithOverrides(Price $parentPrice, ?string $intervalOverride, ?string $currencyOverride): ?Price
    {
        // Build query to find child prices
        $query = Price::query()
            ->where('parent_list_price_id', $parentPrice->id)
            ->where('is_active', true);

        // Filter by interval (renew_interval) if provided
        if ($intervalOverride) {
            $query->where('renew_interval', $intervalOverride);
        }

        // Filter by currency if provided
        if ($currencyOverride && $currencyOverride !== 'auto') {
            $query->where('currency', strtoupper($currencyOverride));
        }

        // Return the first matching child price
        return $query->first();
    }

    /**
     * Decode a JWT customer token using ApiKey HS256 secret. Returns [ApiKey, payload array].
     */
    private function decodeCustomerToken(string $jwt): array
    {
        $headers = json_decode(JWT::urlsafeB64Decode(collect(explode('.', $jwt))->first()), true);
        $kid = $headers['kid'] ?? null;

        $apiKey = ApiKey::retrieve($kid);

        $keys = new Key($apiKey->key, 'HS256');

        throw_if(empty($keys), new \RuntimeException('No active API key secret available'));

        $decoded = JWT::decode($jwt, $keys);
        // Normalize to array
        $payload = json_decode(json_encode($decoded), true);

        Log::info(logname(), [
            'payload_keys' => array_keys($payload ?? []),
            'kid' => $kid,
            'api_key_id' => $apiKey?->id,
        ]);

        return [$apiKey, $payload];
    }
}
