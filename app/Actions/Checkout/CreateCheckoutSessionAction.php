<?php

namespace App\Actions\Checkout;

use App\Enums\IntegrationType;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;
use App\Models\Catalog\Price;

class CreateCheckoutSessionAction
{
    public function __construct(
        private readonly CreateCheckoutLineItemAction $createCheckoutLineItemAction
    ) {}

    public function execute(Offer $offer, array $checkoutItems, bool $testMode = false, ?string $intervalOverride = null, ?string $currencyOverride = null): CheckoutSession
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
                'payments_integration_id' => $paymentIntegration?->id,
                'test_mode' => $testMode,
            ]);

        // If no explicit checkout items provided, use offer's default items
        if (empty($checkoutItems)) {
            foreach ($offer->offerItems as $offerItem) {
                if (! $offerItem->default_price_id || !$offerItem->is_required) {
                    continue;
                }

                $priceId = $offerItem->default_price_id;
                
                // Apply interval/currency overrides if provided
                if ($intervalOverride || $currencyOverride) {
                    $defaultPrice = Price::find($offerItem->default_price_id);
                    if ($defaultPrice) {
                        $overriddenPrice = $this->findPriceWithOverrides($defaultPrice, $intervalOverride, $currencyOverride);
                        if ($overriddenPrice) {
                            $priceId = $overriddenPrice->id;
                        }
                    }
                }

                $this->createCheckoutLineItemAction->execute(
                    $checkoutSession,
                    $offerItem,
                    $priceId,
                     1
                );
            }
        } else {
            // Process explicit checkout items with overrides
            foreach ($checkoutItems as $item) {
                $priceId = $item['price_id'];
                
                // Apply interval/currency overrides if provided
                if ($intervalOverride || $currencyOverride) {
                    $originalPrice = Price::find($item['price_id']);
                    if ($originalPrice) {
                        $overriddenPrice = $this->findPriceWithOverrides($originalPrice, $intervalOverride, $currencyOverride);
                        if ($overriddenPrice) {
                            $priceId = $overriddenPrice->id;
                        }
                    }
                }
                
                $this->createCheckoutLineItemAction->execute(
                    $checkoutSession,
                    null,
                    $priceId,
                    $item['quantity']
                );
            }
        }

        return $checkoutSession;
    }

    /**
     * Find a price that matches the given interval and/or currency overrides
     */
    private function findPriceWithOverrides(Price $parentPrice, ?string $intervalOverride, ?string $currencyOverride): ?Price
    {
        // First check if parent price already matches
        $parentMatches = true;
        if ($intervalOverride && $parentPrice->renew_interval !== $intervalOverride) {
            $parentMatches = false;
        }
        if ($currencyOverride && $currencyOverride !== 'auto' && strtoupper($parentPrice->currency) !== strtoupper($currencyOverride)) {
            $parentMatches = false;
        }
        
        // Return parent if it already matches
        if ($parentMatches) {
            return $parentPrice;
        }

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
