<?php

namespace App\Actions\Checkout;

use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;

class CreateCheckoutSessionAction
{
    public function __construct(
        private readonly CreateCheckoutLineItemAction $createCheckoutLineItemAction
    ) {}

    public function execute(Offer $offer, array $checkoutItems): CheckoutSession
    {
        $checkoutSession = CheckoutSession::create([
            'organization_id' => $offer->organization_id,
            'offer_id' => $offer->id,
        ]);

        foreach ($offer->offerItems as $offerItem) {
            if (! $offerItem->default_price_id || !$offerItem->is_required) {
                continue;
            }

            $this->createCheckoutLineItemAction->execute(
                $checkoutSession,
                $offerItem,
                $offerItem->default_price_id,
                 1
            );
        }

        foreach ($checkoutItems as $item) {
            $this->createCheckoutLineItemAction->execute(
                $checkoutSession,
                null,
                $item['price_id'],
                $item['quantity']
            );
        }

        return $checkoutSession;
    }
}
