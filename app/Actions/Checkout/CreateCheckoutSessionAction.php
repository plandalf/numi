<?php

namespace App\Actions\Checkout;

use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;

class CreateCheckoutSessionAction
{
    public function __construct(
        private readonly CreateCheckoutLineItemAction $createCheckoutLineItemAction
    ) {}

    public function execute(Offer $offer): CheckoutSession
    {
        $checkoutSession = CheckoutSession::create([
            'organization_id' => $offer->organization_id,
            'offer_id' => $offer->id,
        ]);

        foreach ($offer->slots as $slot) {
            if (! $slot->default_price_id) {
                continue;
            }

            $this->createCheckoutLineItemAction->execute(
                checkoutSession: $checkoutSession,
                slot: $slot
            );
        }

        return $checkoutSession;
    }
}
