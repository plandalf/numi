<?php

namespace App\Modules\Integrations\Stripe;

use App\Enums\ChargeType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Integration;
use App\Modules\Integrations\AbstractIntegration;
use App\Modules\Integrations\Contracts\CanCreatePrice;
use App\Modules\Integrations\Contracts\CanCreateProducts;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;

use Stripe\StripeClient;

class Stripe extends AbstractIntegration implements
    CanCreateSubscription,
    CanSetupIntent,
    CanCreateProducts,
    CanCreatePrice
{
    protected StripeClient $stripe;

    public function __construct(private readonly Integration $integration) {
        $this->stripe = new StripeClient([
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
        return $this->stripe->products->create([
            'name' => $product->name,
        ]);
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

        return $this->stripe->prices->create($attrs);
    }
}
