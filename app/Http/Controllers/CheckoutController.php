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
use App\Services\FontExtractionService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Uri;
use App\Models\Catalog\Price;
use App\Traits\HandlesLandingPageDomains;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

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

        // Get override parameters from query string
        $intervalOverride = $request->query('interval');
        $currencyOverride = $request->query('currency');

        // If no currency override is provided, check for regional currency based on CloudFlare header
        if (!$currencyOverride) {
            $countryCode = $request->header('CF-IPCountry');
            $regionalCurrency = $offer->organization->getRegionalCurrency($countryCode);
            if ($regionalCurrency) {
                $currencyOverride = strtolower($regionalCurrency);
            }
        }

        // Process any explicit checkout items from query string
        $checkoutItems = collect(Arr::wrap($checkoutItems))
            ->map(function ($item, $key) use ($offer) {
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

                if (!$price) {
                    return [
                        'items' => ["Price with lookup_key '{$item['lookup_key']}' not found"],
                    ];
                }

                return ['price_id' => $price->id];
            })
            ->all();


        $testMode = $environment === 'test';

        $checkoutSession = $this->createCheckoutSessionAction
            ->execute($offer, $checkoutItems, $testMode, $intervalOverride, $currencyOverride);

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

        // Extract fonts for preloading
        $customFonts = $this->fontExtractionService->extractAllFontsForOffer($offer);
        $googleFontsUrl = $this->fontExtractionService->buildGoogleFontsUrl($customFonts);

        return Inertia::render('checkout', [
            'fonts' => FontResource::collection(FontElement::cases()),
            'offer' => new OfferResource($offer),
            'checkoutSession' => new CheckoutSessionResource($checkout),
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

        //? setup_intent=seti_1RnPRbFmvUKqVS2HaScBgV8o
        //& setup_intent_client_secret=seti_1RnPRbFmvUKqVS2HaScBgV8o_secret_Sir9YRUPn3vjLQKzh0tTh8V0l7ibMDL
        //& redirect_status=succeeded
        // Update checkout with redirect metadata

        $session->update([
            'metadata' => array_merge($session->metadata ?? [], [
                'redirect_return_at' => now()->toISOString(),
                'redirect_status' => $redirectStatus,
                'redirect_params' => $request->all(),
            ])
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
                return redirect()->away($currentUrl . '?numi-state=payment_failed&reason=' . urlencode($redirectStatus));
            } else {
                // Fallback to signed checkout URL with error state
                $signedUrl = URL::signedRoute('checkouts.show', ['checkout' => $session->getRouteKey()], now()->addDays(5));
                return redirect()->away($signedUrl . '&numi-state=payment_failed&reason=' . urlencode($redirectStatus));
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
        $isPopup = $request->query('numi-embed-type') === 'popup' ||
                   $request->query('numi-embed-id') ||
                   $session->metadata['is_popup'] ?? false;

        if ($isPopup && $currentUrl) {
            // For popup scenarios, redirect back to the original page with success state
            // This allows the parent window to handle the success and close the popup
            $successUrl = $currentUrl . '?numi-state=payment_completed&checkout_id=' . $session->getRouteKey();

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
