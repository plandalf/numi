<?php

namespace App\Modules\Integrations\Stripe;

use App\Enums\ChargeType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Checkout\CheckoutSession;
use App\Models\Customer;
use App\Models\Integration;
use App\Models\Order\Order;
use App\Modules\Integrations\AbstractIntegration;
use App\Modules\Integrations\Contracts\AcceptsDiscount;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;
use App\Modules\Integrations\Contracts\CanRetrieveIntent;
use App\Modules\Integrations\Contracts\HasPrices;
use App\Modules\Integrations\Contracts\HasProducts;
use App\Modules\Integrations\Stripe\Actions\ImportStripePriceAction;
use App\Modules\Integrations\Stripe\Actions\ImportStripeProductAction;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Stripe\PaymentIntent;
use Stripe\SetupIntent;
use Stripe\StripeClient;
use Illuminate\Support\Facades\Log;

class Stripe extends AbstractIntegration implements CanCreateSubscription, CanSetupIntent, CanRetrieveIntent, HasPrices, HasProducts, AcceptsDiscount
{
    protected StripeClient $stripeClient;

    public function __construct(public Integration $integration)
    {
        $this->stripeClient = new StripeClient([
            'api_key' => $this->integration->secret,
            'stripe_account' => $this->integration->lookup_key,
        ]);
    }

    public function createSetupIntent(Order|CheckoutSession $order, string $confirmationToken = null, array $data = [])
    {
        // [stripe-intent] Support both new session-based flow and existing order-based flow
        if ($order instanceof \App\Models\Checkout\CheckoutSession) {
            // New flow: working with CheckoutSession before order exists
            $session = $order;

            // JIT: Create setup intent for subscriptions without confirmation token
            // Get payment method types from data or fall back to session enabled methods
            $paymentMethodTypes = $data['payment_method_types'] ?? $session->enabled_payment_methods ?? ['card'];

            $setupIntentData = [
                'customer' => $data['customer'] ?? $session->customer?->reference_id,
                'usage' => $data['usage'] ?? 'off_session',
                'metadata' => array_merge($data['metadata'] ?? [], [
                    'checkout_session_id' => $session->getRouteKey(),
                ]),
                'payment_method_types' => $paymentMethodTypes,
            ];

            // Get enabled payment methods that are compatible with this currency
            $enabledPaymentMethods = $session->enabled_payment_methods;

            // Use specific payment method types if we have filtered methods, otherwise use automatic
            if (!empty($enabledPaymentMethods)) {
                $setupIntentData['payment_method_types'] = $enabledPaymentMethods;

                // Check if any of the enabled methods are redirect-based
                $redirectMethods = ['ideal', 'sofort', 'bancontact', 'giropay', 'eps', 'p24', 'alipay', 'wechat_pay', 'klarna', 'afterpay_clearpay', 'affirm', 'fpx', 'grabpay', 'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay', 'zip', 'swish', 'twint', 'mb_way', 'multibanco', 'blik', 'mobilepay', 'vipps', 'satispay'];
                $hasRedirectMethods = !empty(array_intersect($enabledPaymentMethods, $redirectMethods));

                if ($hasRedirectMethods) {
                    // Allow redirects for redirect-based payment methods
                    $setupIntentData['automatic_payment_methods'] = [
                        'enabled' => true,
                        'allow_redirects' => 'always',
                    ];

                    // Add return URL for redirect-based payments
                    $setupIntentData['return_url'] = config('app.url') . '/checkout/' . $session->getRouteKey() . '/callback';
                } else {
                    // Disable redirects for non-redirect methods
                    $setupIntentData['automatic_payment_methods'] = [
                        'enabled' => true,
                        'allow_redirects' => 'never',
                    ];
                }
            } else {
                $setupIntentData['automatic_payment_methods'] = [
                    'enabled' => true,
                    'allow_redirects' => 'never',
                ];
            }

            // Create a more specific idempotency key for setup intents
            $idempotencyKeyData = [
                'session_id' => $session->getRouteKey(),
                'customer' => $setupIntentData['customer'] ?? null,
                'usage' => $setupIntentData['usage'] ?? 'off_session',
                'payment_method_types' => $setupIntentData['payment_method_types'] ?? [],
            ];

            $idempotencyKey = $session->getRouteKey() . '-setup-' . md5(serialize($idempotencyKeyData));

            \Log::info('JIT: Creating setup intent with idempotency key', [
                'checkout_session_id' => $session->id,
                'idempotency_key' => $idempotencyKey,
                'payment_method_types' => $setupIntentData['payment_method_types'] ?? [],
                'customer' => $setupIntentData['customer'] ?? null,
            ]);

            return $this->stripeClient->setupIntents->create($setupIntentData, [
                'idempotency_key' => $idempotencyKey,
            ]);
        }

        // Legacy flow: working with Order (existing logic)
        // Ensure checkout_session relationship is loaded
        $order->load('checkoutSession');

        $confirmationToken = $this->stripeClient
            ->confirmationTokens
            ->retrieve($confirmationToken);

        $billingDetails = $confirmationToken->payment_method_preview->billing_details;
        $stripeCustomer = $this->createCustomer([
            'email' => $billingDetails->email,
            'name' => $billingDetails->name,
        ]);

        // note, this may already be set?

        $customer = Customer::create([
            'organization_id' => $order->organization_id,
            'integration_id' => $this->integration->id,
            'reference_id' => $stripeCustomer->id,
            'email' => $billingDetails->email,
            'name' => $billingDetails->name,
        ]);

        $order->customer_id = $customer->id;
        $order->save();

        // Get the currency from the order to filter payment methods properly
        $currency = $order->checkout_session->currency ?? 'usd';

        // Get enabled payment methods that are compatible with this currency
        $enabledPaymentMethods = $order->checkout_session->enabled_payment_methods;

        // Prepare setup intent data
        $setupIntentData = [
            'customer' => $customer->reference_id,
            'confirm' => true,
            'confirmation_token' => $confirmationToken,
            'usage' => 'off_session',
        ];

        // Use specific payment method types if we have filtered methods, otherwise use automatic
        if (!empty($enabledPaymentMethods)) {
            $setupIntentData['payment_method_types'] = $enabledPaymentMethods;

            // Check if any of the enabled methods are redirect-based
            $redirectMethods = ['ideal', 'sofort', 'bancontact', 'giropay', 'eps', 'p24', 'alipay', 'wechat_pay', 'klarna', 'afterpay_clearpay', 'affirm', 'fpx', 'grabpay', 'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay', 'zip', 'swish', 'twint', 'mb_way', 'multibanco', 'blik', 'mobilepay', 'vipps', 'satispay'];
            $hasRedirectMethods = !empty(array_intersect($enabledPaymentMethods, $redirectMethods));

            if ($hasRedirectMethods) {
                // Allow redirects for redirect-based payment methods
                $setupIntentData['automatic_payment_methods'] = [
                    'enabled' => true,
                    'allow_redirects' => 'always',
                ];

                // Add return URL for redirect-based payments
                $setupIntentData['return_url'] = config('app.url') . '/checkout/' . $order->checkout_session->getRouteKey() . '/callback';
            } else {
                // Disable redirects for non-redirect methods
                $setupIntentData['automatic_payment_methods'] = [
                    'enabled' => true,
                    'allow_redirects' => 'never',
                ];
            }
        } else {
            $setupIntentData['automatic_payment_methods'] = [
                'enabled' => true,
                'allow_redirects' => 'never',
            ];
        }

        // Create a more specific idempotency key for legacy setup intents
        $idempotencyKeyData = [
            'order_id' => $order->id,
            'customer' => $setupIntentData['customer'] ?? null,
            'confirmation_token' => $confirmationToken->id ?? null,
            'payment_method_types' => $setupIntentData['payment_method_types'] ?? [],
        ];

        $idempotencyKey = $order->id . '-setup-legacy-' . md5(serialize($idempotencyKeyData));

        $setupIntent = $this->stripeClient->setupIntents->create($setupIntentData, [
            'idempotency_key' => $idempotencyKey,
        ]);

        // TODO: totally review this!

        // After successful setup, attach the payment method to the customer and set as default
        if ($setupIntent->status === 'succeeded' && $setupIntent->payment_method) {
            $this->stripeClient->paymentMethods->attach(
                $setupIntent->payment_method,
                ['customer' => $customer->reference_id]
            );

            $this->setDefaultPaymentMethod($customer->reference_id, $setupIntent->payment_method);

            // Update the payment method in our database with the actual external_id
            if ($order->checkoutSession->paymentMethod) {
                $order->checkoutSession->paymentMethod->update([
                    'external_id' => $setupIntent->payment_method,
                ]);
            }
        }

        return $setupIntent;
    }

    public function createCustomer(array $attrs = [])
    {
        logger()->info('createCustomer', ['attrs' => $attrs]);

        return $this->stripeClient->customers->create($attrs);
    }

    public function getStripeClient(): StripeClient
    {
        return $this->stripeClient;
    }

    public function getSetupIntent($intentId)
    {
        return $this->stripeClient->setupIntents->retrieve($intentId);
    }

    public function createSubscription(Order $order)
    {
        // items?

        $order = $data['order'] ?? null;
        $items = $data['items'] ?? [];
        $discounts = $data['discounts'] ?? [];
        $cancelAt = $data['cancel_at'] ?? null;

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
                // todo: create this as draft?
            ],
            'expand' => ['latest_invoice.payment_intent'],
        ];

        if ($cancelAt) {
            $subscriptionData['cancel_at'] = $cancelAt;
        }

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

    public function createSetupIntentForCheckout(CheckoutSession $session, Customer $customer, ?string $selectedPmType, ?array $paymentMethods = null): SetupIntent
    {
        // Get payment method types from data or fall back to session enabled methods
        $paymentMethodTypes = $paymentMethods ?? $session->enabled_payment_methods ?? ['card'];

        // Filter out specific payment method types that are not supported for JIT intents
        $paymentMethodTypes = collect($paymentMethodTypes)
            ->filter(fn ($i) => !in_array($i, ['apple_pay', 'google_pay']))
            ->values();

        $setupIntentData = [
            'customer' => $customer->reference_id,
            'metadata' => [
                'checkout_session_id' => $session->getRouteKey(),
            ],
            'payment_method_types' => $paymentMethodTypes->all(),
//            'usage' => 'off_session',
        ];

        // Create a more specific idempotency key that includes key parameters
        // This prevents conflicts when parameters change (e.g., payment method types)
        $idempotencyKeyData = [
            'session_id' => $session->getRouteKey(),
            'customer' => $setupIntentData['customer'] ?? null,
            'payment_method_types' => $setupIntentData['payment_method_types'] ?? [],
        ];

        // Create a hash of the key parameters for the idempotency key
        $idempotencyKey = $session->getRouteKey() . '-' . md5(serialize($idempotencyKeyData));

        if ($session->intent_id) {
            return $this->stripeClient
                ->setupIntents
                ->update($session->intent_id, $setupIntentData);
        }

        return $this->stripeClient
            ->setupIntents
            ->create($setupIntentData, [
                'idempotency_key' => $idempotencyKey,
            ]);
    }

    public function createPaymentIntentForCheckout(CheckoutSession $session, Customer $customer, ?string $selectedPmType, ?array $paymentMethods = null): PaymentIntent
    {
        $amount = $session->total;
        $currency = $session->currency;

        // Get payment method types from data or fall back to session enabled methods
        $paymentMethodTypes = $paymentMethods ?? $session->enabled_payment_methods ?? ['card'];

        // Filter out specific payment method types that are not supported for JIT intents
        $paymentMethodTypes = collect($paymentMethodTypes)
            ->filter(fn ($i) => !in_array($i, ['apple_pay', 'google_pay']))
            ->values();

        // Create payment intent with explicit payment method types
        $paymentIntentData = array_filter([
            'amount' => (int) $amount,
            'currency' => strtolower($currency),
            'customer' => $customer->reference_id,
            'metadata' => [
                'checkout_session_id' => $session->getRouteKey(),
            ],
            'payment_method_types' => $paymentMethodTypes->all(),
        ]);

        // Create a more specific idempotency key that includes key parameters
        // This prevents conflicts when parameters change (e.g., payment method types)
        $idempotencyKeyData = [
            'session_id' => $session->getRouteKey(),
            'amount' => $paymentIntentData['amount'],
            'currency' => $paymentIntentData['currency'],
            'customer' => $paymentIntentData['customer'] ?? null,
            'payment_method_types' => $paymentIntentData['payment_method_types'] ?? [],
        ];

        // Create a hash of the key parameters for the idempotency key
        $idempotencyKey = $session->getRouteKey() . '-' . md5(serialize($idempotencyKeyData));

        if ($session->intent_id) {
            return $this->stripeClient
                ->paymentIntents
                ->update($session->intent_id, $paymentIntentData);
        }

        return $this->stripeClient
            ->paymentIntents
            ->create($paymentIntentData, [
                'idempotency_key' => $idempotencyKey,
            ]);
    }

    /**
     * Create a direct payment intent using a confirmation token
     * This is used for one-time payments that don't require saving payment methods
     */
//    public function createDirectPaymentIntent(array $data = [])
//    {
//        $order = $data['order'] ?? null;
//        $items = $data['items'] ?? [];
//        $discounts = $data['discounts'] ?? [];
//        $confirmationToken = $data['confirmation_token'] ?? null;
//
//        if (!$order || empty($items) || !$confirmationToken) {
//            throw new \InvalidArgumentException('Order, items, and confirmation token are required to create a direct payment intent');
//        }
//
//        // Ensure checkout_session and customer relationships are loaded
//        $order->load(['checkoutSession', 'customer']);
//
//        // Get the customer from the order
//        $customer = $order->customer;
//
//        if (!$customer) {
//            throw new \InvalidArgumentException('Customer is required to create a direct payment intent');
//        }
//
//        // Calculate the total amount
//        $amount = 0;
//        $currency = null;
//
//        foreach ($items as $item) {
//            $price = $item['price'];
//            $quantity = $item['quantity'] ?? 1;
//
//            if (!$currency) {
//                $currency = $price['currency'];
//            } elseif ($currency !== $price['currency']) {
//                throw new \InvalidArgumentException('All items must have the same currency');
//            }
//
//            $amount += $price['amount']->getAmount() * $quantity;
//        }
//
//        // Apply discounts if any
//        if (!empty($discounts)) {
//            $discountAmount = 0;
//            foreach ($discounts as $discount) {
//                try {
//                    // Try to get the promotion code for this discount
//                    $promotionCode = $this->stripeClient->promotionCodes->all([
//                        'code' => $discount['id'],
//                        'active' => true,
//                        'limit' => 1
//                    ])->data[0] ?? null;
//
//                    if ($promotionCode) {
//                        // Apply promotion code discount
//                        if ($promotionCode->coupon->percent_off) {
//                            $discountAmount += $amount * ($promotionCode->coupon->percent_off / 100);
//                        } else {
//                            $discountAmount += $promotionCode->coupon->amount_off;
//                        }
//                    } else {
//                        // Fallback to direct coupon calculation
//                        if (isset($discount['percent_off'])) {
//                            $discountAmount += $amount * ($discount['percent_off'] / 100);
//                        } elseif (isset($discount['amount_off'])) {
//                            $discountAmount += $discount['amount_off'];
//                        }
//                    }
//                } catch (\Exception $e) {
//                    logger()->warning('Failed to apply discount to direct payment intent', [
//                        'discount_id' => $discount['id'],
//                        'error' => $e->getMessage()
//                    ]);
//                }
//            }
//            $amount = max(0, $amount - $discountAmount);
//        }
//
//        // Get enabled payment methods that are compatible with this currency
//        $enabledPaymentMethods = $order->checkoutSession?->enabled_payment_methods ?? [];
//
//        // Prepare payment intent data
//        $paymentIntentData = [
//            'amount' => (int) $amount,
//            'currency' => strtolower($currency),
//            'customer' => $customer->reference_id,
//            'confirmation_token' => $confirmationToken,
//            'confirm' => true,
//            'metadata' => [
//                'order_id' => $order->id,
//                'payment_type' => 'direct_one_time',
//            ],
//            //'setup_future_usage' => 'off_session',
//
//            //ConfirmationTokens help transport client side data collected by Stripe JS over to your server for
//            // confirming a PaymentIntent or SetupIntent.
//            // If the confirmation is successful, values present on the ConfirmationToken are written onto the Intent.
//
//            // TODO: idempotency key for a checkout
//            // allow people to swap?
//            // we may need to change intent on cart?
//        ];
//
//        // Use specific payment method types to avoid conflicts with Stripe Elements
//        $paymentIntentData['payment_method_types'] = ['card'];
//
//        // TODO: support other types of payment methods
//        //
////        $paymentIntent = $stripe->paymentIntents->create([
////            'payment_method_types' => ['klarna'],
////            'amount' => 1099,
////            'currency' => 'eur',
////        ]);
//
//        // Add return URL for 3D Secure flows
//        // dont
////        $paymentIntentData['return_url'] = config('app.url') . '/checkout/complete';
//
//        // todo: do some kind of redirect?
//
//        // Create the payment intent with the confirmation token
//        $paymentIntent = $this->stripeClient->paymentIntents->create($paymentIntentData);
//
//        // If the payment intent has a payment method, update our database
//        // Note: The payment method update is now handled in ProcessOrder to ensure proper flow
//        if ($paymentIntent->payment_method) {
//            Log::info(logname('intent-created'), [
//                'payment_intent_id' => $paymentIntent->id,
//                'payment_method_id' => $paymentIntent->payment_method,
//                'status' => $paymentIntent->status,
//            ]);
//        }
//
//        return $paymentIntent;
//    }

    public function getDiscount(string $code)
    {
        return $this->stripeClient->coupons->retrieve($code);
    }

    /**
     * Get available payment methods from Stripe's API
     * This fetches real payment method capabilities for the account
     */
    public function getAvailablePaymentMethods(?string $currency = null): array
    {
        try {
            // Get account details to determine capabilities
            $account = $this->stripeClient->accounts->retrieve();

            // Get country-specific payment method support
            $country = $account->country ?? 'US';
            $currency ??= $account->default_currency;

            // Map of Stripe API payment method types to display names
            // Only including payment methods that support SetupIntent
            $paymentMethodMap = [
                'card' => 'Credit/Debit Cards',
                'apple_pay' => 'Apple Pay',
                'google_pay' => 'Google Pay',
                'link' => 'Link',
                'us_bank_account' => 'US Bank Account (ACH)',
                'sepa_debit' => 'SEPA Direct Debit',
                'bacs_debit' => 'Bacs Direct Debit',
                'au_becs_debit' => 'BECS Direct Debit',
                'acss_debit' => 'Canadian PADs',
                'cashapp' => 'Cash App Pay',
                'amazon_pay' => 'Amazon Pay',
                'revolut_pay' => 'Revolut Pay',
                'paypal' => 'PayPal',
            ];

            // Filter payment methods based on currency and country
            $availablePaymentMethods = $this->filterPaymentMethodsByCurrencyAndCountry(
                array_keys($paymentMethodMap),
                $currency,
                $country
            );

            // Return only the available ones with their display names
            $result = [];
            foreach ($availablePaymentMethods as $method) {
                if (isset($paymentMethodMap[$method])) {
                    $result[$method] = $paymentMethodMap[$method];
                }
            }

            return $result;

        } catch (\Exception $e) {
            // Fallback to default payment methods if API call fails
            logger()->error('Failed to fetch payment methods from Stripe', [
                'error' => $e->getMessage(),
                'integration_id' => $this->integration->id
            ]);

            return [
                'card' => 'Credit/Debit Cards',
                'apple_pay' => 'Apple Pay',
                'google_pay' => 'Google Pay',
            ];
        }
    }

    /**
     * Get payment methods that only support PaymentIntent (not SetupIntent)
     * These are typically "pay now" only methods like BNPL
     */
    public function getPaymentOnlyMethods(string $currency = 'usd'): array
    {
        try {
            // Get account details to determine capabilities
            $account = $this->stripeClient->accounts->retrieve();

            // Get country-specific payment method support
            $country = $account->country ?? 'US';

            // Payment methods that only support PaymentIntent (immediate payments)
            $paymentOnlyMethodMap = [
                'ideal' => 'iDEAL',
                'sofort' => 'Sofort',
                'bancontact' => 'Bancontact',
                'giropay' => 'Giropay',
                'eps' => 'EPS',
                'p24' => 'Przelewy24',
                'alipay' => 'Alipay',
                'wechat_pay' => 'WeChat Pay',
                'klarna' => 'Klarna',
                'afterpay_clearpay' => 'Afterpay/Clearpay',
                'affirm' => 'Affirm',
                'au_becs_debit' => 'BECS Direct Debit',
                'fpx' => 'FPX',
                'grabpay' => 'GrabPay',
                'oxxo' => 'OXXO',
                'boleto' => 'Boleto',
                'konbini' => 'Konbini',
                'paynow' => 'PayNow',
                'promptpay' => 'PromptPay',
                'zip' => 'Zip',
                'swish' => 'Swish',
                'twint' => 'TWINT',
                'mb_way' => 'MB WAY',
                'multibanco' => 'Multibanco',
                'blik' => 'BLIK',
                'mobilepay' => 'MobilePay',
                'vipps' => 'Vipps',
                'satispay' => 'Satispay',
            ];

            // Filter payment methods based on currency and country
            $availablePaymentMethods = $this->filterPaymentMethodsByCurrencyAndCountry(
                array_keys($paymentOnlyMethodMap),
                $currency,
                $country
            );

            // Return only the available ones with their display names
            $result = [];
            foreach ($availablePaymentMethods as $method) {
                if (isset($paymentOnlyMethodMap[$method])) {
                    $result[$method] = $paymentOnlyMethodMap[$method];
                }
            }

            return $result;

        } catch (\Exception $e) {
            logger()->error('Failed to fetch payment-only methods from Stripe', [
                'error' => $e->getMessage(),
                'integration_id' => $this->integration->id
            ]);

            return [];
        }
    }

    /**
     * Filter payment methods based on currency and country restrictions
     * Based on Stripe's documentation for payment method support
     */
    private function filterPaymentMethodsByCurrencyAndCountry(array $paymentMethods, string $currency, string $country): array
    {
        $currency = strtolower($currency);
        $country = strtoupper($country);

        // Currency and country restrictions based on Stripe's documentation
        $restrictions = [
            'us_bank_account' => [
                'currencies' => ['usd'],
                'countries' => ['US']
            ],
            'sepa_debit' => [
                'currencies' => ['eur'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
            ],
            'ideal' => [
                'currencies' => ['eur'],
                'countries' => ['AU', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'MX', 'NZ', 'SG', 'US']
            ],
            'sofort' => [
                'currencies' => ['eur'],
                'countries' => ['AU', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'MX', 'NZ', 'SG', 'US']
            ],
            'bancontact' => [
                'currencies' => ['eur'],
                'countries' => ['AU', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'MX', 'NZ', 'SG', 'US']
            ],
            'giropay' => [
                'currencies' => ['eur'],
                'countries' => ['AU', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'MX', 'NZ', 'SG', 'US']
            ],
            'eps' => [
                'currencies' => ['eur'],
                'countries' => ['AU', 'AT', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'MX', 'NZ', 'SG', 'US']
            ],
            'p24' => [
                'currencies' => ['eur', 'pln'],
                'countries' => ['AU', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'MX', 'NZ', 'SG', 'US']
            ],
            'alipay' => [
                'currencies' => ['aud', 'cad', 'cny', 'eur', 'gbp', 'hkd', 'jpy', 'myr', 'nzd', 'sgd', 'usd'],
                'countries' => ['AU', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'NZ', 'SG', 'US']
            ],
            'wechat_pay' => [
                'currencies' => ['aud', 'cad', 'chf', 'cny', 'dkk', 'eur', 'gbp', 'hkd', 'jpy', 'nok', 'sek', 'sgd', 'usd'],
                'countries' => ['AU', 'CA', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'HK', 'JP', 'SG', 'GB', 'US']
            ],
            'klarna' => [
                'currencies' => ['aud', 'cad', 'chf', 'czk', 'dkk', 'eur', 'gbp', 'nok', 'nzd', 'pln', 'ron', 'sek', 'usd'],
                'countries' => ['AU', 'AT', 'BE', 'CA', 'HR', 'CY', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NZ', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB', 'US']
            ],
            'afterpay_clearpay' => [
                'currencies' => ['aud', 'cad', 'eur', 'nzd', 'gbp', 'usd'],
                'countries' => ['AU', 'CA', 'NZ', 'GB', 'US']
            ],
            'affirm' => [
                'currencies' => ['cad', 'usd'],
                'countries' => ['CA', 'US']
            ],
            'paypal' => [
                'currencies' => ['aud', 'cad', 'chf', 'czk', 'dkk', 'eur', 'gbp', 'hkd', 'nok', 'nzd', 'pln', 'sek', 'sgd', 'usd'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB']
            ],
            'bacs_debit' => [
                'currencies' => ['gbp'],
                'countries' => ['GB']
            ],
            'au_becs_debit' => [
                'currencies' => ['aud'],
                'countries' => ['AU']
            ],
            'acss_debit' => [
                'currencies' => ['cad', 'usd'],
                'countries' => ['CA', 'US']
            ],
            'fpx' => [
                'currencies' => ['myr'],
                'countries' => ['MY']
            ],
            'grabpay' => [
                'currencies' => ['myr', 'sgd'],
                'countries' => ['MY', 'SG']
            ],
            'oxxo' => [
                'currencies' => ['mxn'],
                'countries' => ['MX']
            ],
            'boleto' => [
                'currencies' => ['brl'],
                'countries' => ['BR']
            ],
            'konbini' => [
                'currencies' => ['jpy'],
                'countries' => ['JP']
            ],
            'paynow' => [
                'currencies' => ['sgd'],
                'countries' => ['SG']
            ],
            'promptpay' => [
                'currencies' => ['thb'],
                'countries' => ['TH']
            ],
            'cashapp' => [
                'currencies' => ['usd'],
                'countries' => ['US']
            ],
            'amazon_pay' => [
                'currencies' => ['usd'],
                'countries' => ['AT', 'BE', 'CY', 'DK', 'FR', 'DE', 'HU', 'IE', 'IT', 'LU', 'NL', 'PT', 'ES', 'SE', 'CH', 'GB', 'US']
            ],
            'revolut_pay' => [
                'currencies' => ['eur', 'gbp', 'usd'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB']
            ],
            'zip' => [
                'currencies' => ['aud'],
                'countries' => ['AU']
            ],
            'swish' => [
                'currencies' => ['sek'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IS', 'IT', 'LV', 'LT', 'LU', 'NL', 'NO', 'PL', 'RO', 'SK', 'SI', 'ES', 'SE']
            ],
            'twint' => [
                'currencies' => ['chf'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GI', 'GR', 'HU', 'IE', 'IS', 'IT', 'LV', 'LT', 'LU', 'MT', 'MC', 'NL', 'NO', 'PL', 'PT', 'RO', 'SM', 'SK', 'SI', 'SE', 'ES', 'CH', 'GB']
            ],
            'mb_way' => [
                'currencies' => ['eur'],
                'countries' => ['AU', 'AT', 'BE', 'BG', 'CA', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GI', 'GR', 'HK', 'HU', 'IE', 'IT', 'JP', 'LV', 'LT', 'LU', 'MT', 'MX', 'NL', 'NZ', 'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB', 'US']
            ],
            'multibanco' => [
                'currencies' => ['eur'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GI', 'GR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB', 'US']
            ],
            'blik' => [
                'currencies' => ['pln'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
            ],
            'mobilepay' => [
                'currencies' => ['dkk', 'eur', 'nok', 'sek'],
                'countries' => ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
            ],
            'vipps' => [
                'currencies' => ['nok'],
                'countries' => ['NO']
            ],
            'satispay' => [
                'currencies' => ['eur'],
                'countries' => ['IT']
            ],
        ];

        // Filter payment methods based on restrictions
        $filtered = [];

        foreach ($paymentMethods as $method) {
            // Always include basic payment methods
            if (in_array($method, ['card', 'apple_pay', 'google_pay', 'link'])) {
                $filtered[] = $method;
                continue;
            }

            // Check if method has restrictions
            if (isset($restrictions[$method])) {
                $restriction = $restrictions[$method];

                // Check currency restriction
                if (isset($restriction['currencies']) && !in_array($currency, $restriction['currencies'])) {
                    continue;
                }

                // Check country restriction
                if (isset($restriction['countries']) && !in_array($country, $restriction['countries'])) {
                    continue;
                }
            }

            $filtered[] = $method;
        }

        return $filtered;
    }

    /**
     * Set a payment method as the default for a customer in Stripe
     */
    public function setDefaultPaymentMethod(string $customerId, string $paymentMethodId): void
    {
        try {
            $this->stripeClient->customers->update($customerId, [
                'invoice_settings' => [
                    'default_payment_method' => $paymentMethodId,
                ],
            ]);

            Log::info(logname('ok'), [
                'customer_id' => $customerId,
                'payment_method_id' => $paymentMethodId,
            ]);
        } catch (\Exception $e) {
            Log::error(logname('fail'), [
                'customer_id' => $customerId,
                'payment_method_id' => $paymentMethodId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update a payment intent with new data
     */
    public function updatePaymentIntent(string $intentId, array $data = []): void // [stripe-intent]
    {
        $this->stripeClient->paymentIntents->update($intentId, $data);
    }

    /**
     * Retrieve a payment intent by ID
     */
    public function retrievePaymentIntent(string $intentId) // [stripe-intent]
    {
        return $this->stripeClient->paymentIntents->retrieve($intentId);
    }

    /**
     * Retrieve an intent by ID and type (payment or setup)
     */
    public function retrieveIntent(string $intentId, string $intentType)
    {
        if ($intentType === 'payment') {
            return $this->stripeClient->paymentIntents->retrieve($intentId);
        } elseif ($intentType === 'setup') {
            return $this->stripeClient->setupIntents->retrieve($intentId);
        } else {
            throw new \InvalidArgumentException("Unknown intent type: {$intentType}");
        }
    }
}
