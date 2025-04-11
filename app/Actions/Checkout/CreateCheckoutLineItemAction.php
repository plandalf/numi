<?php

namespace App\Actions\Checkout;

use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Slot;

class CreateCheckoutLineItemAction
{
    public function execute(CheckoutSession $checkoutSession, Slot $slot): CheckoutLineItem
    {
        return CheckoutLineItem::create([
            'organization_id' => $checkoutSession->organization_id,
            'checkout_session_id' => $checkoutSession->id,
            'price_id' => $slot->default_price_id,
            'slot_id' => $slot->id,
            'quantity' => 1,
            'total_amount' => $slot->defaultPrice->amount,
        ]);
    }
}
