<?php

namespace App\Http\Controllers\Client;

use App\Actions\Checkout\CommitCheckoutAction;
use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Http\Controllers\Controller;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;
use Illuminate\Http\Request;

class CheckoutSessionController extends Controller
{
    public function __construct(
        private readonly CreateCheckoutSessionAction $createCheckoutSessionAction,
        private readonly CommitCheckoutAction $commitCheckoutAction
    ) {}

    public function store(Offer $offer)
    {
        $checkoutSession = $this->createCheckoutSessionAction->execute($offer);

        /** @todo return JSON resource */
        return $checkoutSession->toArray();
    }

    public function commit(CheckoutSession $checkoutSession)
    {
        $this->commitCheckoutAction->execute($checkoutSession);

        return redirect()->route('checkout.show', $checkoutSession);
    }

    public function show(CheckoutSession $checkoutSession)
    {
        /** @todo return JSON resource */
        return $checkoutSession->toArray();
    }

    public function update(Request $request, CheckoutSession $checkoutSession)
    {
        $checkoutSession->update($request->all());

        /** @todo return JSON resource */
        return $checkoutSession->toArray();
    }

    public function destroy(CheckoutSession $checkoutSession)
    {
        $checkoutSession->delete();

        return response()->noContent();
    }
}
