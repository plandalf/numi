<?php

namespace App\Modules\Integrations\Stripe;

use App\Enums\ChargeType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Integration;
use App\Modules\Integrations\AbstractIntegration;
use App\Modules\Integrations\Contracts\HasPrices;
use App\Modules\Integrations\Contracts\HasProducts;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;
use App\Modules\Integrations\Stripe\Actions\ImportStripeProductAction;
use Stripe\StripeClient;

class Stripe extends AbstractIntegration implements
    CanCreateSubscription,
    CanSetupIntent,
    HasProducts,
    HasPrices
{
    protected StripeClient $stripeClient;

    public function __construct(public Integration $integration) {
        $this->stripeClient = new StripeClient([
            'api_key' => $this->integration->secret,
            'stripe_account' => $this->integration->lookup_key,
        ]);
    }

    public function createSetupIntent()
    {
        // return $this->client->setupIntents->create();
    }

    public function getSetupIntent($intentId)
    {
        // return $this->client->setupIntents->retrieve($intentId);
    }

    public function createSubscription(array $data = [])
    {
        // return $this->client->subscriptions->create($data);
    }

    public function createProduct(Product $product)
    {
        return $this->stripeClient->products->create([
            'name' => $product->name,
        ]);
    }

    public function getAllProducts(array $params = [])
    {
        return $this->stripeClient->products->all($params);
    }

    public function getProduct(string $gatewayProductId)
    {
        return $this->stripeClient->products->retrieve($gatewayProductId);
    }

    public function searchProducts(array $params = [])
    {
        $searchParams = [
            'query' => isset($params['search']) ? "name~\"{$params['search']}\"" : '',
            'limit' => $params['limit'] ?? 100,
        ];

        return $this->stripeClient->products->search($searchParams);
    }

    public function createPrice(Price $price, Product $product)
    {
        $attrs = [
            'product' => $product->gateway_product_id,
            'currency' => $price->currency,
            'active' => $price->is_active,
            'lookup_key' => $price->lookup_key,
        ];

        if($price->renew_interval || $price->recurring_interval_count) {
            $attrs['recurring'] = [
                'interval' => $price->renew_interval,
                'interval_count' => $price->recurring_interval_count,
            ];
        }

        /** @todo set tiers properly */
        if($price->type === ChargeType::ONE_TIME) {
            $attrs['billing_scheme'] = 'per_unit';
            $attrs['unit_amount'] = $price->amount->getAmount();
        } else {
            $attrs['billing_scheme'] = 'tiered';
            $attrs['tiers_mode'] = $price->type === ChargeType::GRADUATED ? 'graduated' : 'volume';
            $attrs['tiers'] = $price->properties ?? [];
        }

        return $this->stripeClient->prices->create($attrs);
    }

    public function getAllPrices(array $params = [])
    {
        return $this->stripeClient->prices->all($params);
    }

    public function searchPrices(array $params = [])
    {
        $searchParams = [
            'query' => isset($params['search']) ? "active:\"true\" AND lookup_key:\"{$params['search']}\"" : 'active:\"true\"',
            'limit' => $params['limit'] ?? 100,
        ];

        return $this->stripeClient->prices->search($searchParams);
    }

    public function importProduct(array $attrs = []): ?Product
    {
        $gatewayProductId = data_get($attrs, 'gateway_product_id');
        $gatewayPrices = data_get($attrs, 'gateway_prices');
        $productAttrs = [
            data_get($attrs, 'lookup_key', $gatewayProductId),
            data_get($attrs, 'name', $gatewayProductId),
            data_get($attrs, 'description', $gatewayProductId),
        ];

        if(!$gatewayProductId || !$gatewayPrices) return null;


        return (new ImportStripeProductAction)(
            $this->integration,
            $gatewayProductId,
            $gatewayPrices,
            $productAttrs
        );
    }


}
