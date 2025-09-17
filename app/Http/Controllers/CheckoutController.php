<?php

namespace App\Http\Controllers;

use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Actions\Checkout\FetchSavedPaymentMethodsAction;
use App\Actions\Checkout\PreviewSubscriptionChangeAction;
use App\Enums\Theme\FontElement;
use App\Http\Resources\Checkout\CheckoutSessionResource;
use App\Http\Resources\FontResource;
use App\Http\Resources\OfferResource;
use App\Http\Requests\Checkout\InitializeCheckoutRequest;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\PaymentMethod;
use App\Models\Store\Offer;
use App\Services\CustomerTokenService;
use App\Services\FontExtractionService;
use App\Traits\HandlesLandingPageDomains;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Pipeline;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    use HandlesLandingPageDomains;

    public function __construct(
        private readonly FontExtractionService $fontExtractionService,
        private readonly CustomerTokenService $customerTokenService,
    ) {}

    public function initialize(Offer $offer, InitializeCheckoutRequest $request, string $environment = 'live')
    {
        $offer->loadMissing('organization');
        $jwtContext = null;

        if ($token = $request->customerToken()) {
            $jwtContext = $this->customerTokenService->decode($token);
        }


        // Resolve currency at the request level (prefer explicit, else CF fallback)
        $currency = $request->currencyOverride();
        if (! $currency) {
            $countryCode = $request->header('CF-IPCountry');
            $regionalCurrency = $offer->organization->getRegionalCurrency($countryCode);
            if ($regionalCurrency) {
                $currency = strtolower($regionalCurrency);
            }
        }
        $request->setResolvedCurrency($currency);

        $action = app(CreateCheckoutSessionAction::class, [
            'offer' => $offer,
            'testMode' => $environment === 'test',
        ]);

        $checkoutSession = $action->execute($request, $jwtContext);

        $this->handleInvalidDomain($request, $checkoutSession);

        $params = array_filter(array_merge([
            'session' => $checkoutSession->getRouteKey(),
        ], $request->only(['embed-id', 'embed-type', 'numi-embed-type', 'numi-embed-id', 'numi-embed-parent-page'])));

        if ($request->has('redirect_url')) {
            $params['redirect_url'] = $request->get('redirect_url');
        }

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

        return Inertia::render('client/checkout', [
            'fonts' => FontResource::collection(FontElement::cases()),
            'offer' => new OfferResource($offer),
            'checkoutSession' => new CheckoutSessionResource($checkoutSession),
            'preview' => Inertia::defer(function () use ($checkoutSession) {
                return app(PreviewSubscriptionChangeAction::class)($checkoutSession);
            }),
            'savedPaymentMethods' => Inertia::defer(function () use ($checkoutSession, $offer) {
                return app(FetchSavedPaymentMethodsAction::class)($checkoutSession);
            }),
            'signedShowUrl' => URL::signedRoute('checkouts.show', $params, now()->addDays(5)),
        ])->with([
            'customFonts' =>  $customFonts = $this->fontExtractionService->extractAllFontsForOffer($offer),
            'googleFontsUrl' => $this->fontExtractionService->buildGoogleFontsUrl($customFonts),
        ]);
    }

    /**
     * Verify a JWT-provided Stripe customer id exists for the session's connected account and
     * associate/create a local Customer accordingly.
     */
    private function verifyAndAssociateJwtCustomer(CheckoutSession $checkoutSession, Offer $offer, string $stripeCustomerId, array $customerProperties = [], ?string $jwtUserId = null, ?string $jwtGroupId = null): void
    {
        try {
            if (! $checkoutSession->payments_integration_id || empty($stripeCustomerId)) {
                return;
            }

            $checkoutSession->loadMissing('paymentsIntegration');
            $stripeClient = $checkoutSession->paymentsIntegration
                ->integrationClient()
                ->getStripeClient();

            // Throws if not found/unauthorized
            $stripeClient->customers->retrieve($stripeCustomerId);

            $local = \App\Models\Customer::query()->firstOrCreate([
                'organization_id' => $offer->organization_id,
                'integration_id' => $checkoutSession->payments_integration_id,
                'reference_id' => (string) $stripeCustomerId,
            ], [
                'email' => $customerProperties['email'] ?? null,
                'name' => $customerProperties['name'] ?? null,
            ]);

            if (! $checkoutSession->customer_id) {
                $checkoutSession->customer_id = $local->id;
                $checkoutSession->metadata = array_merge($checkoutSession->metadata ?? [], [
                    'jwt' => array_filter([
                        'sub' => $jwtUserId,
                        'grp' => $jwtGroupId,
                        'customer_id' => $stripeCustomerId,
                    ], fn ($v) => ! is_null($v)),
                ]);
                $checkoutSession->save();
            }
        } catch (\Throwable $e) {
            Log::warning('verifyAndAssociateJwtCustomer failed', [
                'checkout_session_id' => $checkoutSession->id,
                'customer_id' => $stripeCustomerId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function show(CheckoutSession $session, Request $request)
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired checkout link.');
        }

        $this->handleInvalidDomain($request, $session);

        if ($session->hasACompletedOrder()) {
            return redirect()
                ->to(URL::signedRoute('order-status.show', ['order' => $session->order], now()->addDays(30)));
        }

        $session->load([
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

        $offer = $session->offer;
        $json = $offer->view;

        /**
         * @todo Replace with the actual view json
         */
        $json['first_page'] = data_get($session->metadata, 'current_page_id', $json['first_page']);
        $json['page_history'] = data_get($session->metadata, 'page_history', []);
        $offer->view = $json;

        // Extract fonts for preloading
        $customFonts = $this->fontExtractionService->extractAllFontsForOffer($offer);
        $googleFontsUrl = $this->fontExtractionService->buildGoogleFontsUrl($customFonts);

        return Inertia::render('client/checkout', [
            'fonts' => FontResource::collection(FontElement::cases()),
            'offer' => new OfferResource($offer),

            // calculation ?
            'checkoutSession' => new CheckoutSessionResource($session),

            // General preview for new or existing sessions
            'preview' => Inertia::defer(function () use ($session) {
                return app(PreviewSubscriptionChangeAction::class)($session);
            }),

            // Deferred preview for subscription upgrade/swap deltas
            'subscriptionPreview' => Inertia::defer(function () use ($session) {
                return app(PreviewSubscriptionChangeAction::class)($session);
            }),
            // Also provide saved payment methods on the canonical show route
            'savedPaymentMethods' => Inertia::defer(function () use ($session, $offer) {
                //, $verifyJwtCustomerId, $customerProperties, $jwtUserId, $jwtGroupId
                return app(FetchSavedPaymentMethodsAction::class)($session);
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

}
