<?php

namespace App\Modules\Integrations\Stripe;

use App\Enums\ChargeType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Customer;
use App\Models\Integration;
use App\Models\Order\Order;
use App\Modules\Integrations\AbstractIntegration;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;
use App\Modules\Integrations\Contracts\HasPrices;
use App\Modules\Integrations\Contracts\HasProducts;
use App\Modules\Integrations\Stripe\Actions\ImportStripePriceAction;
use App\Modules\Integrations\Stripe\Actions\ImportStripeProductAction;
use Stripe\StripeClient;

class Stripe extends AbstractIntegration implements CanCreateSubscription, CanSetupIntent, HasPrices, HasProducts
{
    protected StripeClient $stripeClient;

    public function __construct(public Integration $integration)
    {
        $this->stripeClient = new StripeClient([
            'api_key' => $this->integration->secret,
            'stripe_account' => $this->integration->lookup_key,
        ]);
    }

    public function createSetupIntent(Order $order, string $confirmationToken)
    {
        $confirmationToken = $this->stripeClient
            ->confirmationTokens
            ->retrieve($confirmationToken);

        $billingDetails = $confirmationToken->payment_method_preview->billing_details;
        $stripeCustomer = $this->createCustomer([
            'email' => $billingDetails->email,
            'name' => $billingDetails->name,
        ]);

        $customer = Customer::create([
            'organization_id' => $order->organization_id,
            'integration_id' => $this->integration->id,
            'reference_id' => $stripeCustomer->id,
            'email' => $billingDetails->email,
            'name' => $billingDetails->name,
        ]);

        $order->customer_id = $customer->id;
        $order->save();

        $setupIntent = $this->stripeClient->setupIntents->create([
            'customer' => $customer->reference_id,
            'automatic_payment_methods' => [
                'enabled' => true,
                'allow_redirects' => 'never',
            ],
            'confirm' => true,
            'confirmation_token' => $confirmationToken,
            'usage' => 'off_session',
        ]);

        // After successful setup, attach the payment method to the customer and set as default
        if ($setupIntent->status === 'succeeded' && $setupIntent->payment_method) {
            $this->stripeClient->paymentMethods->attach(
                $setupIntent->payment_method,
                ['customer' => $customer->reference_id]
            );

            $this->stripeClient->customers->update(
                $customer->reference_id,
                ['invoice_settings' => ['default_payment_method' => $setupIntent->payment_method]]
            );
        }

        return $setupIntent;
    }

    public function createCustomer(array $attrs = [])
    {
        logger()->info('createCustomer', ['attrs' => $attrs]);

        return $this->stripeClient->customers->create($attrs);
    }

    public function getSetupIntent($intentId)
    {
        return $this->stripeClient->setupIntents->retrieve($intentId);
    }

    public function createSubscription(array $data = [])
    {
        $order = $data['order'] ?? null;
        $items = $data['items'] ?? [];

        if (! $order || empty($items)) {
            throw new \InvalidArgumentException('Order and items are required to create a subscription');
        }

        // Get the customer from the order
        $customer = $order->customer;

        if (! $customer) {
            throw new \InvalidArgumentException('Customer is required to create a subscription');
        }

        // Prepare subscription items
        $subscriptionItems = [];
        foreach ($items as $item) {
            $subscriptionItems[] = [
                'price' => $item['price']['gateway_price_id'],
                'quantity' => $item['quantity'] ?? 1,
            ];
        }

        logger()->info('createSubscription', ['subscriptionItems' => $subscriptionItems]);

        // Create the subscription
        $subscription = $this->stripeClient->subscriptions->create([
            'customer' => $customer->reference_id,
            'items' => $subscriptionItems,
            'payment_settings' => [
                'payment_method_types' => ['card'],
                'save_default_payment_method' => 'on_subscription',
            ],
            'expand' => ['latest_invoice.payment_intent'],
        ]);

        // Update the order with subscription information
        // $order->update([
        //     'subscription_id' => $subscription->id,
        //     'subscription_status' => $subscription->status,
        // ]);

        return $subscription;
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

        if ($price->renew_interval || $price->recurring_interval_count) {
            $attrs['recurring'] = [
                'interval' => $price->renew_interval,
                'interval_count' => $price->recurring_interval_count,
            ];
        }

        /** @todo set tiers properly */
        if ($price->type === ChargeType::ONE_TIME) {
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

        if (! $gatewayProductId || ! $gatewayPrices) {
            return null;
        }

        return (new ImportStripeProductAction)(
            $this->integration,
            $gatewayProductId,
            $gatewayPrices,
            $productAttrs
        );
    }

    public function importPrice(Product $product, array $gatewayPrices = [])
    {
        return (new ImportStripePriceAction)($product, $gatewayPrices);
    }

    public function createPaymentIntent(array $data = [])
    {
        $order = $data['order'] ?? null;
        $items = $data['items'] ?? [];

        if (! $order || empty($items)) {
            throw new \InvalidArgumentException('Order and items are required to create a payment intent');
        }

        // Get the customer from the order
        $customer = $order->customer;

        if (! $customer) {
            throw new \InvalidArgumentException('Customer is required to create a payment intent');
        }

        // Calculate the total amount
        $amount = 0;
        $currency = null;

        foreach ($items as $item) {
            $price = $item['price'];
            $quantity = $item['quantity'] ?? 1;

            if (! $currency) {
                $currency = $price['currency'];
            } elseif ($currency !== $price['currency']) {
                throw new \InvalidArgumentException('All items must have the same currency');
            }

            $amount += $price['amount'] * $quantity;
        }

        // Create the payment intent
        $paymentIntent = $this->stripeClient->paymentIntents->create([
            'amount' => (int) ($amount * 100), // Convert to cents
            'currency' => strtolower($currency),
            'customer' => $customer->reference_id,
            'automatic_payment_methods' => [
                'enabled' => true,
                'allow_redirects' => 'never',
            ],
            'metadata' => [
                'order_id' => $order->id,
            ],
        ]);

        // Update the order with payment intent information
        // $order->update([
        //     'payment_intent_id' => $paymentIntent->id,
        //     'payment_status' => $paymentIntent->status,
        // ]);

        return $paymentIntent;
    }
}
