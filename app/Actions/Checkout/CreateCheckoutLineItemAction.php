<?php

namespace App\Actions\Checkout;

use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\OfferItem;

class CreateCheckoutLineItemAction
{
    public function execute(CheckoutSession $checkoutSession,  ?OfferItem $offerItem, ?int $priceId, ?int $quantity = 1): CheckoutLineItem
    {
        return CheckoutLineItem::create([
            'organization_id' => $checkoutSession->organization_id,
            'checkout_session_id' => $checkoutSession->id,
            'price_id' => $priceId,
            'offer_item_id' => $offerItem?->id,
            'quantity' => $quantity,
        ]);
    }
}
