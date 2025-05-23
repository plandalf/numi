<?php

namespace App\Http\Controllers;

use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Http\Resources\Checkout\CheckoutSessionResource;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CreateCheckoutSessionAction $createCheckoutSessionAction
    ) {}

    public function initialize(string $offerId)
    {
        $offer = Offer::retrieve($offerId);
        $checkoutSession = $this->createCheckoutSessionAction->execute($offer);

        return redirect()->to(URL::signedRoute('checkouts.show', [
            'checkout' => $checkoutSession->getRouteKey(),
        ], now()->addDays(5)));
    }

    public function show(CheckoutSession $checkout, Request $request)
    {
        // Validate the signed URL
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired checkout link.');
        }

        $checkout->load(['lineItems.offerItem', 'offer.theme', 'lineItems.price.integration']);

        $offer = $checkout->offer;

//        $json = json_decode(file_get_contents(base_path('resources/view-example.json')), true);
        $json = $offer->view;

        /**
         * @todo Replace with the actual view json
         */
        $json['first_page'] = $checkout->metadata['current_page_id'] ?? $json['first_page'];
        $offer->view = $json;

        return Inertia::render('checkout', [
            'offer' => $offer,
            'checkoutSession' => new CheckoutSessionResource($checkout),
        ]);
    }
}
