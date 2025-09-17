<?php

namespace App\Actions\Checkout;

use App\Enums\IntegrationType;
use App\Http\Requests\Checkout\InitializeCheckoutRequest;
use App\ValueObjects\CheckoutAuthorization;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class CreateCheckoutSessionAction
{
    public function __construct(
        private readonly CreateCheckoutLineItemAction $createCheckoutLineItemAction,
        private readonly Offer $offer,
        private readonly bool $testMode,
    ) {}

    public function execute(InitializeCheckoutRequest $request, ?CheckoutAuthorization $auth = null): CheckoutSession
    {
        $offer = $this->offer;
        $checkoutItems = $request->items();

        $intervalOverride = $request->intervalOverride();
        $currencyOverride = $request->currency();

        $primaryPriceLookup = $request->primaryPriceLookup();
        if (! $intervalOverride && $primaryPriceLookup) {
            $primaryPrice = Price::query()
                ->where('organization_id', $offer->organization_id)
                ->where('lookup_key', $primaryPriceLookup)
                ->where('is_active', true)
                ->first();

            if ($primaryPrice && $primaryPrice->renew_interval) {
                $intervalOverride = strtolower($primaryPrice->renew_interval);
            }
        }

        $customerProperties = ($auth?->customerProperties ?? $request->customerAsArray());
        $subscription = $request->subscription() ?: ($auth?->subscriptionId);
        $intent = $request->intent($subscription);
        $quantity = $request->quantity();
        $paymentIntegration = $offer->organization
            ->integrations()
            ->where('type', $this->testMode
                ? IntegrationType::STRIPE_TEST
                : IntegrationType::STRIPE)
            ->first();

        $metadata = [];
        if ($auth) {
            $metadata['jwt'] = array_filter([
                'customer_id' => $auth->stripeCustomerId,
                'sub' => $auth->userId,
                'grp' => $auth->groupId,
                'subscription_id' => $auth->subscriptionId,
            ], fn ($v) => ! is_null($v));
        }


        $checkoutSession = CheckoutSession::query()->create([
            'organization_id' => $offer->organization_id,
            'offer_id' => $offer->id,
            'payments_integration_id' => $paymentIntegration?->id,
            'test_mode' => $this->testMode,
            'properties' => $customerProperties,
            'intent' => $intent ?? 'purchase',
            'subscription' => $intent === 'upgrade' ? ($subscription ? (string) $subscription : null) : null,
            'subject' => ($request->subject() ?: ($auth?->userId)) ? (string) ($request->subject() ?: ($auth?->userId)) : null,
            'metadata' => !empty($metadata) ? $metadata : null,
        ]);


        $customer = $offer->organization
            ->customers()
            ->where([
                'reference_id' => $auth?->stripeCustomerId
            ])
            ->first();

        $checkoutSession->customer_id = $customer?->id;

        // If no explicit checkout items provided, use offer's default items
        if (empty($checkoutItems)) {
            foreach ($offer->offerItems as $offerItem) {
                if (! $offerItem->default_price_id || ! $offerItem->is_required) {
                    continue;
                }

                $priceId = $offerItem->default_price_id;

                // Apply interval/currency overrides if provided
                if ($intervalOverride || $currencyOverride) {
                    /* @var Price|null $defaultPrice */
                    $defaultPrice = $offer->organization
                        ->prices()
                        ->find($offerItem->default_price_id);

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
            // Process explicit checkout items; resolve by lookup_key if provided
            foreach ($checkoutItems as $item) {
                $resolvedPrice = null;
                if (isset($item['lookup_key'])) {
                    $resolvedPrice = Price::query()
                        ->where('organization_id', $offer->organization_id)
                        ->where('lookup_key', $item['lookup_key'])
                        ->where('is_active', true)
                        ->first();
                }

                if (! $resolvedPrice) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => ["Price not found for provided item"],
                    ]);
                }

                $priceId = $resolvedPrice->id;

                if ($intervalOverride || $currencyOverride) {
                    $overriddenPrice = $this->findPriceWithOverrides($resolvedPrice, $intervalOverride, $currencyOverride);
                    if ($overriddenPrice) {
                        $priceId = $overriddenPrice->id;
                    }
                }

                $itemQuantity = $quantity ?? Arr::get($item, 'quantity', 1);

                $this->createCheckoutLineItemAction->execute(
                    $checkoutSession,
                    null,
                    $priceId,
                    $itemQuantity
                );
            }
        }

        if (is_null($checkoutSession->currency)) {
            $checkoutSession->currency = $checkoutSession->lineItems->first()?->price->currency;
            $checkoutSession->save();
        }

        return $checkoutSession;
    }

    /**
     * Find a price that matches the given interval and/or currency overrides
     */
    private function findPriceWithOverrides(Price $parentPrice, ?string $intervalOverride, ?string $currencyOverride): ?Price
    {
        Log::info(logname(), [
            'parent_price_id' => $parentPrice?->id,
            'interval_override' => $intervalOverride,
            'currency_override' => $currencyOverride,
        ]);

        // First check if parent price already matches
        $parentMatches = true;
        if ($intervalOverride && $parentPrice->renew_interval !== $intervalOverride) {
            $parentMatches = false;
        }

        if ($currencyOverride && $currencyOverride !== 'auto'
            && strtolower($parentPrice->currency) !== strtolower($currencyOverride)
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
            $query->where('currency', strtolower($currencyOverride));
        }

        // Return the first matching child price
        return $query->first();
    }
}
