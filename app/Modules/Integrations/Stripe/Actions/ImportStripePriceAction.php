<?php

namespace App\Modules\Integrations\Stripe\Actions;

use App\Enums\IntegrationType;
use App\Enums\ProductStatus;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Integration;
use App\Modules\Integrations\Stripe\Stripe;
use Money\Currency;
use Money\Money;
use Stripe\Price as StripePrice;

class ImportStripePriceAction
{
    public Stripe $stripeClientWrapper;

    public function __invoke(
        Product $product,
        array $gatewayPrices
    ) {
        $this->stripeClientWrapper = $product->integrationClient();
        $stripeProduct = $this->stripeClientWrapper->getProduct($product->gateway_product_id);

        $allPrices = collect();
        $startingAfter = null;

        do {
            $params = [
                'product' => $stripeProduct->id,
                'expand' => [
                    'data.tiers',
                ],
                'limit' => 100,
            ];

            if ($startingAfter) {
                $params['starting_after'] = $startingAfter;
            }

            $prices = $this->stripeClientWrapper->getAllPrices($params);
            $allPrices = $allPrices->concat($prices->data);

            $startingAfter = $prices->has_more ? end($prices->data)->id : null;
        } while ($startingAfter);

        $pricesToImport = $allPrices->filter(fn (StripePrice $price) => in_array($price->id, $gatewayPrices));

        // Import prices for this product
        foreach ($pricesToImport as $stripePrice) {
            $this->createOrUpdatePrice($product, $stripePrice);
        }
    }

    public function createOrUpdatePrice(Product $product, StripePrice $stripePrice): Price
    {
        // Determine the price type based on Stripe's billing scheme
        $type = $this->determinePriceType($stripePrice);

        // Prepare the price data
        $priceData = [
            'product_id' => $product->id,
            'organization_id' => $product->organization_id,
            'integration_id' => $this->stripeClientWrapper->integration->id,
            'gateway_provider' => IntegrationType::STRIPE,
            'gateway_price_id' => $stripePrice->id,
            'lookup_key' => $stripePrice->lookup_key ?? $stripePrice->id,
            'name' => $stripePrice->nickname ?? $product->name,
            'scope' => 'list', // Default to list for imported prices
            'type' => $type,
            'amount' => $stripePrice->unit_amount ? new Money($stripePrice->unit_amount, new Currency($stripePrice->currency)) : 0,
            'currency' => new Currency($stripePrice->currency),
            'is_active' => $stripePrice->active,
            'properties' => $this->extractProperties($stripePrice),
        ];

        // Add recurring fields if applicable
        if (isset($stripePrice->recurring)) {
            $priceData['renew_interval'] = $stripePrice->recurring->interval;
            $priceData['recurring_interval_count'] = $stripePrice->recurring->interval_count;
        }

        // Use updateOrCreate to either update an existing price or create a new one
        return Price::updateOrCreate(
            [
                'organization_id' => $product->organization_id,
                'integration_id' => $this->stripeClientWrapper->integration->id,
                'gateway_price_id' => $stripePrice->id,
            ],
            $priceData
        );
    }

    /**
     * Determine the price type based on Stripe's billing scheme and tiers mode
     */
    private function determinePriceType(StripePrice $stripePrice): string
    {
        if ($stripePrice->billing_scheme === 'per_unit') {
            return 'one_time';
        }

        if ($stripePrice->billing_scheme === 'tiered') {
            return $stripePrice->tiers_mode === 'graduated' ? 'graduated' : 'volume';
        }

        return 'one_time'; // Default fallback
    }

    /**
     * Extract properties from Stripe price for tiered pricing
     */
    private function extractProperties(StripePrice $stripePrice): ?array
    {
        if ($stripePrice->billing_scheme === 'tiered') {
            return $this->convertTiersToProperties($stripePrice->tiers ?? []);
        }

        return null;
    }

    protected function convertTiersToProperties(array $tiers): array
    {
        $properties = [];

        foreach ($tiers as $tier) {
            $properties[] = [
                'flat_amount' => $tier->flat_amount_decimal,
                'unit_amount' => $tier->unit_amount_decimal,
                'up_to' => $tier->up_to,
            ];
        }

        return $properties;
    }
}
