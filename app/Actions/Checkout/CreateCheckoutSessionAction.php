<?php

namespace App\Actions\Checkout;

use App\Enums\IntegrationType;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class CreateCheckoutSessionAction
{
    public function __construct(
        private readonly CreateCheckoutLineItemAction $createCheckoutLineItemAction
    ) {}

    public function execute(
        Offer $offer,
        array $checkoutItems,
        bool $testMode = false,
        ?string $intervalOverride = null,
        ?string $currencyOverride = null,
        array $customerProperties = [],
        string $intent = 'purchase',
        ?string $subscription = null,
        ?int $quantity = null
    ): CheckoutSession {
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
                'properties' => $customerProperties,
                'intent' => $intent ?? 'purchase',
                'subscription' => $intent === 'upgrade' ? $subscription : null,
            ]);

        Log::info(logname(), [
            'checkout_session_id' => $checkoutSession->id,
            'currency_override' => $currencyOverride,
            'items' => $offer->offerItems->count(),
        ]);

        // If no explicit checkout items provided, use offer's default items
        if (empty($checkoutItems)) {
            foreach ($offer->offerItems as $offerItem) {
                if (! $offerItem->default_price_id || ! $offerItem->is_required) {
                    Log::info(logname('skip-items'), [
                        'checkout_session_id' => $checkoutSession->id,
                    ]);
                    continue;
                }

                $priceId = $offerItem->default_price_id;

                Log::info(logname('skip-items'), [
                    'checkout_session_id' => $checkoutSession->id,
                    'default_price_id' => $priceId,
                    'interval_override' => $intervalOverride,
                ]);

                // Apply interval/currency overrides if provided
                if ($intervalOverride || $currencyOverride) {
                    /* @var Price|null $defaultPrice */
                    $defaultPrice = $offer->organization
                        ->prices()
                        ->find($offerItem->default_price_id);

                    Log::info(logname('skip-items'), [
                        'checkout_session_id' => $checkoutSession->id,
                        'default_price_id' => $defaultPrice?->id,
                    ]);

                    if ($defaultPrice) {
                        $overriddenPrice = $this->findPriceWithOverrides($defaultPrice, $intervalOverride, $currencyOverride);

                        Log::info(logname('skip-items'), [
                            'checkout_session_id' => $checkoutSession->id,
                            'override_price' => $overriddenPrice?->id,
                        ]);

                        if ($overriddenPrice) {
                            $priceId = $overriddenPrice->id;
                        }
                    }
                }

                // Use provided quantity or default to 1
                $itemQuantity = $quantity ?? 1;

                $this->createCheckoutLineItemAction->execute(
                    $checkoutSession,
                    $offerItem,
                    $priceId,
                    $itemQuantity
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

                // Use provided quantity or item quantity or default to 1
                $itemQuantity = $quantity ?? Arr::get($item, 'quantity', 1);

                $this->createCheckoutLineItemAction->execute(
                    $checkoutSession,
                    null,
                    $priceId,
                    $itemQuantity
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
        if ($currencyOverride && $currencyOverride !== 'auto'
            && strtoupper($parentPrice->currency) !== strtoupper($currencyOverride)
        ) {
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
