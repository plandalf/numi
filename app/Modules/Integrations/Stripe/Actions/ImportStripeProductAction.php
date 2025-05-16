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
use Stripe\Product as StripeProduct;

class ImportStripeProductAction
{
    public Stripe $stripeClientWrapper;

    public function __invoke(
        Integration $integration,
        string $gatewayProductId,
        array $gatewayPrices,
        array $productAttrs = []
    ) {
        $this->stripeClientWrapper = $integration->integrationClient();
        $product = $this->stripeClientWrapper->getProduct($gatewayProductId);

        return $this->importProduct($product, $productAttrs, $gatewayPrices);
    }

    protected function importProduct(StripeProduct $stripeProduct, array $productAttrs = [], array $gatewayPrices = []): ?Product
    {
        $product = $this->getOrCreateProduct($stripeProduct, $productAttrs);

        (new ImportStripePriceAction)($product, $gatewayPrices);

        return $product;
    }

    private function getOrCreateProduct(StripeProduct $stripeProduct, array $productAttrs = []): Product
    {
        $organizationId = $this->stripeClientWrapper->integration->organization_id;

        return Product::updateOrCreate(
            [
                'organization_id' => $organizationId,
                'gateway_provider' => IntegrationType::STRIPE,
                'gateway_product_id' => $stripeProduct->id,
            ],
            [
                'lookup_key' => data_get($productAttrs, 'lookup_key', $stripeProduct->id),
                'name' => data_get($productAttrs, 'name', $stripeProduct->name),
                'description' => data_get($productAttrs, 'description', $stripeProduct->description),
                'status' => $stripeProduct->active ? ProductStatus::active : ProductStatus::archived,
                'integration_id' => $this->stripeClientWrapper->integration->id,
            ]
        );
    }
}
