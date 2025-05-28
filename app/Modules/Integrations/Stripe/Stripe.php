<?php

namespace App\Modules\Integrations\Stripe;

use App\Enums\ChargeType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Customer;
use App\Models\Integration;
use App\Models\Order\Order;
use App\Modules\Integrations\AbstractIntegration;
use App\Modules\Integrations\Contracts\AcceptsDiscount;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;
use App\Modules\Integrations\Contracts\HasPrices;
use App\Modules\Integrations\Contracts\HasProducts;
use App\Modules\Integrations\Stripe\Actions\ImportStripePriceAction;
use App\Modules\Integrations\Stripe\Actions\ImportStripeProductAction;
use Stripe\StripeClient;

class Stripe extends AbstractIntegration implements CanCreateSubscription, CanSetupIntent, HasPrices, HasProducts, AcceptsDiscount
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
        $discounts = $data['discounts'] ?? [];

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

        // Prepare subscription data
        $subscriptionData = [
            'customer' => $customer->reference_id,
            'items' => $subscriptionItems,
            'payment_settings' => [
                'payment_method_types' => ['card'],
                'save_default_payment_method' => 'on_subscription',
            ],
            'expand' => ['latest_invoice.payment_intent'],
        ];

        // Add discounts if any
        if (!empty($discounts)) {
            $promotionCodes = [];
            foreach ($discounts as $discount) {
                try {
                    // Try to get the promotion code for this coupon
                    $promotionCode = $this->stripeClient->promotionCodes->all([
                        'code' => $discount['id'],
                        'active' => true,
                        'limit' => 1
                    ])->data[0] ?? null;

                    if ($promotionCode) {
                        $promotionCodes[] = $promotionCode->id;
                    } else {
                        // If no promotion code found, try to use as a direct coupon
                        $coupon = $this->stripeClient->coupons->retrieve($discount['id']);
                        if ($coupon) {
                            $subscriptionData['coupon'] = $coupon->id;
                            break; // Only one direct coupon can be applied
                        }
                    }
                } catch (\Exception $e) {
                    logger()->warning('Failed to apply discount', [
                        'discount_id' => $discount['id'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Add promotion codes if any were found
            if (!empty($promotionCodes)) {
                $subscriptionData['promotion_code'] = $promotionCodes[0]; // Use first promotion code
            }
        }

        // Create the subscription
        $subscription = $this->stripeClient->subscriptions->create($subscriptionData);

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
        $discounts = $data['discounts'] ?? [];

        if (! $order || empty($items)) {
            throw new \InvalidArgumentException('Order and items are required to create a payment intent');
        }

        // Get the customer from the order
        $customer = $order->customer;

        if (! $customer) {
            throw new \InvalidArgumentException('Customer is required to create a payment intent');
        }

        // Verify customer has a default payment method
        $stripeCustomer = $this->stripeClient->customers->retrieve($customer->reference_id);
        if (!$stripeCustomer->invoice_settings->default_payment_method) {
            throw new \InvalidArgumentException('Customer has no default payment method set up');
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

            $amount += $price['amount']->getAmount() * $quantity;
        }

        // Apply discounts if any
        if (!empty($discounts)) {
            $discountAmount = 0;
            foreach ($discounts as $discount) {
                try {
                    // Try to get the promotion code for this discount
                    $promotionCode = $this->stripeClient->promotionCodes->all([
                        'code' => $discount['id'],
                        'active' => true,
                        'limit' => 1
                    ])->data[0] ?? null;

                    if ($promotionCode) {
                        // Apply promotion code discount
                        if ($promotionCode->coupon->percent_off) {
                            $discountAmount += $amount * ($promotionCode->coupon->percent_off / 100);
                        } else {
                            $discountAmount += $promotionCode->coupon->amount_off;
                        }
                    } else {
                        // Fallback to direct coupon calculation
                        if (isset($discount['percent_off'])) {
                            $discountAmount += $amount * ($discount['percent_off'] / 100);
                        } elseif (isset($discount['amount_off'])) {
                            $discountAmount += $discount['amount_off'];
                        }
                    }
                } catch (\Exception $e) {
                    logger()->warning('Failed to apply discount', [
                        'discount_id' => $discount['id'],
                        'error' => $e->getMessage()
                    ]);
                }
            }
            $amount = max(0, $amount - $discountAmount);
        }

        // Create the payment intent with the customer's default payment method
        $paymentIntent = $this->stripeClient->paymentIntents->create([
            'amount' => (int) $amount,
            'currency' => strtolower($currency),
            'customer' => $customer->reference_id,
            'payment_method' => $stripeCustomer->invoice_settings->default_payment_method,
            'confirm' => true,
            'off_session' => true,
            'metadata' => [
                'order_id' => $order->id,
            ],
        ]);

        // Verify the payment intent status
        if ($paymentIntent->status === 'requires_payment_method') {
            throw new \InvalidArgumentException('Payment method is required but not provided');
        }

        return $paymentIntent;
    }

    public function getDiscount(string $code)
    {
        return $this->stripeClient->coupons->retrieve($code);
    }
}
