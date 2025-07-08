<?php

namespace App\Http\Controllers;

use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Enums\Theme\FontElement;
use App\Http\Resources\Checkout\CheckoutSessionResource;
use App\Http\Resources\FontResource;
use App\Http\Resources\OfferResource;
use App\Http\Resources\ThemeResource;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;
use App\Models\Theme;
use App\Models\Catalog\Price;
use App\Traits\HandlesLandingPageDomains;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
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

        return redirect()->to(URL::signedRoute('checkouts.show', $params, now()->addDays(5)));
    }

    public function show(CheckoutSession $checkout, Request $request)
    {
        // Validate the signed URL
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired checkout link.');
        }

        $this->handleInvalidDomain($request, $checkout);

        $checkout->load([
            'lineItems.offerItem.offerPrices',
            'offer.theme',
            'offer.organization.logoMedia',
            'offer.organization.faviconMedia',
            'offer.hostedPage.logoImage',
            'offer.hostedPage.backgroundImage',
            'lineItems.price.integration',
            'lineItems.price.product',
            'organization.integrations'
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
}
