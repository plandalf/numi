<?php

namespace App\Actions\Checkout;

use App\Enums\IntegrationType;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;

class CreateCheckoutSessionAction
{
    public function __construct(
        private readonly CreateCheckoutLineItemAction $createCheckoutLineItemAction
    ) {}

    public function execute(Offer $offer, array $checkoutItems, bool $testMode = false): CheckoutSession
    {
        $paymentIntegration = $offer->organization
            ->integrations()
            ->where('type', $testMode
                ? IntegrationType::STRIPE_TEST
                : IntegrationType::STRIPE)
            ->first();

        $checkoutSession = CheckoutSession::query()
            ->create([
                'organization_id' => $offer->organization_id,
                'offer_id' => $offer->id,
                'payments_integration_id' => $paymentIntegration->id,
                'test_mode' => $testMode,
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
