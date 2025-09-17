<?php

namespace App\Actions\Checkout;

use App\Models\Checkout\CheckoutSession;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Log;

class FetchSavedPaymentMethodsAction
{
    public function __invoke(CheckoutSession $checkoutSession): array
    {
        try {
            $checkoutSession->loadMissing(['customer']);
            $customer = $checkoutSession->customer;
            // if (! $customer) {
            //     Log::info('savedPaymentMethods: no local customer', [
            //         'checkout_session_id' => $checkoutSession->id,
            //     ]);
            //     return [];
            // }
            $defaultLocalId = $customer?->default_payment_method_id;
            $methods = $customer ? PaymentMethod::query()
                ->where('customer_id', $customer->id)
                ->orderByDesc('id')
                ->get() : collect();

            Log::info('savedPaymentMethods: local count', [
                'checkout_session_id' => $checkoutSession->id,
                'customer_id' => $customer->id,
                'count' => $methods->count(),
            ]);

            // If no local methods, attempt a one-time sync from Stripe for this connected account
            if ($methods->isEmpty() && $checkoutSession->payments_integration_id && $customer->reference_id) {
                try {
                    $checkoutSession->loadMissing('paymentsIntegration');
                    $stripeClient = $checkoutSession->paymentsIntegration
                        ->integrationClient()
                        ->getStripeClient();

                    $stripePms = $stripeClient->paymentMethods->all([
                        'customer' => $customer->reference_id,
                        'type' => 'card',
                        'limit' => 10,
                    ])->data ?? [];

                    foreach ($stripePms as $spm) {
                        $brand = $spm->card->brand ?? null;
                        $last4 = $spm->card->last4 ?? null;
                        $expMonth = $spm->card->exp_month ?? null;
                        $expYear = $spm->card->exp_year ?? null;
                        $properties = [
                            'brand' => $brand,
                            'last4' => $last4,
                            'exp_month' => $expMonth,
                            'exp_year' => $expYear,
                            'card' => [
                                'brand' => $brand,
                                'last4' => $last4,
                                'exp_month' => $expMonth,
                                'exp_year' => $expYear,
                            ],
                        ];
                        PaymentMethod::query()->firstOrCreate([
                            'customer_id' => $customer->id,
                            'organization_id' => $checkoutSession->organization_id,
                            'integration_id' => $checkoutSession->payments_integration_id,
                            'external_id' => $spm->id,
                        ], [
                            'type' => $spm->type ?? 'card',
                            'properties' => $properties,
                            'metadata' => $spm->metadata ?? [],
                            'can_redisplay' => true,
                            'billing_details' => $spm->billing_details ? (array) $spm->billing_details : [],
                        ]);
                    }

                    // Re-fetch methods after sync
                    $methods = PaymentMethod::query()
                        ->where('customer_id', $customer->id)
                        ->orderByDesc('id')
                        ->get();

                    Log::info('savedPaymentMethods: synced from stripe', [
                        'count' => $methods->count(),
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('savedPaymentMethods: stripe sync failed', [
                        'customer_reference_id' => $customer->reference_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return $methods->map(function (PaymentMethod $pm) use ($defaultLocalId) {
                return [
                    // Use external_id (Stripe PM id) so we can set default in Stripe when chosen
                    'id' => $pm->external_id,
                    'type' => $pm->type,
                    'properties' => $pm->properties,
                    'isDefault' => $pm->id === $defaultLocalId,
                ];
            })->all();
        } catch (\Throwable $e) {
            Log::warning(logname('failed'), ['error' => $e->getMessage()]);
            return [];
        }
    }
}
