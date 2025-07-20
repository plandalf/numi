<?php

namespace App\Actions\Checkout;

use App\Enums\ChargeType;
use App\Exceptions\CheckoutException;
use App\Models\Checkout\CheckoutSession;
use App\Models\Customer;
use App\Modules\Integrations\Stripe\Stripe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Uri;
use Stripe\PaymentIntent;
use Stripe\SetupIntent;

class PreparePaymentAction
{
    protected Stripe $stripe;

    public function __construct(protected CheckoutSession $session)
    {
        $stripe = $this->session->integrationClient();
        throw_if(is_null($stripe), CheckoutException::message('Stripe integration not found for this session.'));
        $this->stripe = $stripe;
    }

    /**
     * @param array{
     *     email?: string,
     *     payment_type?: string,
     *     current_url?: string,
     * } $data
     */
    public function __invoke(array $data = [])
    {;
        $email = $data['email'] ?? null;
        $paymentType = $data['payment_type'] ?? null;
        $currentUrl = Uri::of($data['current_url'] ?? '');

        $this->session->fill([
            'properties' => array_merge($session->properties ?? [], $data)
        ]);

        // Create or get customer for this email
        $customer = $this->findOrCreateCustomer($email);

        // Determine intent mode based on cart contents
        $intentMode = $this->determineIntentMode();

        // Create the appropriate Stripe intent
        $intent = $this->createStripeIntent($customer, $intentMode, $paymentType);

        // if success, we can bail out?

        $this->session->intent_id = $intent->id;
        $this->session->intent_type = $intentMode;
        $this->session->client_secret = $intent->client_secret;
        $this->session->save();

        try {
            $match = filled(Route::getRoutes()->match(Request::create($currentUrl->path())));
        } catch (\Throwable $e) {
            $match = false;
        }

        // Update checkout with intent details
        $this->session->update([
            'metadata' => array_merge($this->session->metadata ?? [], [
                'current_url' => $currentUrl,
                'selected_payment_method' => $paymentType,
                'payment_method_selected_at' => now()->toISOString(),
            ]),
            'return_url' => $match ? null : strval($currentUrl),
        ]);

        $redirectMethods = [
            'klarna', 'afterpay_clearpay', 'affirm', 'ideal', 'sofort', 'bancontact',
            'giropay', 'eps', 'p24', 'alipay', 'wechat_pay', 'fpx', 'grabpay',
            'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay', 'zip', 'swish',
            'twint', 'mb_way', 'multibanco', 'blik', 'mobilepay', 'vipps', 'satispay'
        ];

        $isRedirectMethod = $paymentType && in_array($paymentType, $redirectMethods);

//        canceled
//processing
//requires_action
//requires_capture
//requires_confirmation
//requires_payment_method
//succeeded
        $response = [
            'intent_state' => $intent->status,
            'intent_id' => $intent->id,
            'intent_type' => $intentMode,
            'client_secret' => $intent->client_secret,
        ];

        // Always provide return_url - Stripe requires it for all payment confirmations
        // For redirect methods, use the redirect return route
        // For card payments, use the current URL as fallback for 3D Secure etc.
        if ($isRedirectMethod) {
            $response['return_url'] = route('checkout.redirect.callback', [$this->session]);
            $response['is_redirect_method'] = true;;
        } else {
            // For card payments, use current URL as return_url for 3D Secure etc.
            $response['return_url'] = $currentUrl;
            $response['is_redirect_method'] = false;
        }

        return $response;

    }


    /**
     * Determine the stripe intent mode based on cart contents
     */
    private function determineIntentMode(): string
    {
        $hasSubscriptionItems = $this->session
            ->lineItems()
            ->whereHas('price', function ($query) {
                $query->whereIn('type', ChargeType::recurringTypes());
            })
            ->exists();

        return ($hasSubscriptionItems) ? 'setup':  'payment';
    }

    protected function findOrCreateCustomer(string $email): ?Customer
    {
        if ($this->session->customer) {
            return $this->session->customer;
        }

        $stripeCustomer = $this->stripe->createCustomer([
            'email' => $email,
            'metadata' => [],
        ]);

        $customer = Customer::query()
            ->create([
                'organization_id' => $this->session->organization_id,
                'integration_id' => $this->session->payments_integration_id,
                'reference_id' => $stripeCustomer->id,
                'email' => $email,
            ]);

        $this->session->customer()->associate($customer);
        $this->session->save();

        return $customer;
    }

    /**
     * Create the appropriate Stripe intent based on cart contents
     */
    private function createStripeIntent(?Customer $customer, string $intentMode, string $selectedPmType): mixed
    {
        if ($intentMode === 'payment') {
            return $this->createPaymentIntent($customer, $selectedPmType);
        }

        return $this->createSetupIntent($customer);
    }

    /**
     * Create a PaymentIntent for one-time payments
     */
    private function createPaymentIntent(Customer $customer, string $selectedPmType): PaymentIntent|SetupIntent|null
    {
        $paymentMethods = $this->getFilteredPaymentMethods('payment');

        return $this->stripe->createPaymentIntentForCheckout($this->session, $customer, $selectedPmType, $paymentMethods);
    }

    /**
     * Create a SetupIntent for subscriptions
     */
    private function createSetupIntent(Customer $customer): array
    {
        // Get filtered payment methods for this context
        $paymentMethods = $this->getFilteredPaymentMethods($checkoutSession, 'setup');

        $intent = $integrationClient->createSetupIntent([
            'checkout_session' => $checkoutSession,
            'customer' => $customer?->reference_id,
            'metadata' => [
                'checkout_session_id' => $checkoutSession->getRouteKey(),
                'jit_created' => true,
            ],
            'payment_method_types' => $paymentMethods,
            'usage' => 'off_session',
        ]);

        return [
            'intent_id' => $intent->id,
            'intent_type' => 'setup',
            'client_secret' => $intent->client_secret,
        ];
    }

    /**
     * Get filtered payment methods based on checkout context
     * This implements the same logic as the frontend PaymentIntelligenceService
     */
    private function getFilteredPaymentMethods(string $intentMode): array
    {
        $enabledMethods = $this->session->enabled_payment_methods ?? ['card'];

        // Filter out non-recurring methods for subscription mode
        if ($intentMode === 'setup') {
            $nonRecurringMethods = [
                'klarna', 'afterpay_clearpay', 'affirm', 'zip', 'alipay', 'wechat_pay',
                'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay'
            ];

            $enabledMethods = array_filter($enabledMethods, function ($method) use ($nonRecurringMethods) {
                return !in_array($method, $nonRecurringMethods);
            });
        }

        // Apply amount limits for payment mode
        if ($intentMode === 'payment' && $this->session->total > 0) {
            $enabledMethods = $this->filterByAmountLimits($enabledMethods, $this->session->total, $this->session->currency);
        }

        // Ensure we have at least card as fallback
        if (empty($enabledMethods)) {
            $enabledMethods = ['card'];
        }

        return array_values($enabledMethods);
    }

    /**
     * Filter payment methods by amount limits (same logic as frontend)
     */
    private function filterByAmountLimits(array $methods, int $totalInCents, string $currency): array
    {
        $limits = [
            'afterpay_clearpay' => [
                'usd' => 200000, 'cad' => 250000, 'aud' => 300000,
                'nzd' => 300000, 'gbp' => 150000, 'eur' => 180000
            ],
            'affirm' => [ 'usd' => 175000, 'cad' => 200000 ],
            'klarna' => [
                'usd' => 100000, 'eur' => 100000, 'gbp' => 80000,
                'aud' => 150000, 'cad' => 120000
            ],
            'zip' => [ 'usd' => 100000, 'aud' => 150000 ]
        ];

        $currencyLower = strtolower($currency);

        return array_filter($methods, function ($method) use ($limits, $totalInCents, $currencyLower) {
            if (!isset($limits[$method])) {
                return true; // No limits for this method
            }

            $methodLimits = $limits[$method];
            if (!isset($methodLimits[$currencyLower])) {
                return true; // No limit for this currency
            }

            $limit = $methodLimits[$currencyLower];
            return $totalInCents <= $limit;
        });
    }


}
