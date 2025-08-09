<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Integration;
use App\Enums\IntegrationType;
use Carbon\Carbon;
use App\Models\Customer;
use Illuminate\Support\Facades\Log;
use App\Models\Catalog\Price;
use App\Models\ApiKey;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class BillingPortalController extends Controller
{

    public function show(Request $request)
    {
        $customer = array_filter([
            'email' => $request->query('email'),
            'name' => $request->query('name'),
            'external_id' => $request->query('id'),
        ]);

        // Incoming must be a JWT (HS256) containing { customer_id: "cus_..." }
        $token = $request->query('customer')
            ?: $request->query('customer_id')
            ?: $request->query('cid');

        $customerId = null;
        if ($token) {
            try {
                $customerId = $this->decodeCustomerToken($token);
            } catch (\Throwable $e) {
                Log::warning('Invalid billing portal token', ['error' => $e->getMessage()]);
                return response()->json(['ok' => false, 'error' => 'Invalid token'], 403);
            }
        }

        $returnUrl = $request->query('return_url');

        // Find Stripe integration for the organization (hardcoded org_id = 1 per request)
        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->first();

        return Inertia::render('client/billing-portal', [
            'customer' => $customer,
            'customerId' => $customerId,
            'returnUrl' => $returnUrl,
            'testToken' => $this->generateTestCustomerToken('cus_TEST_12345'),
            'subscription' => Inertia::defer(function () use ($integration, $customerId) {
                if (! $integration || ! $customerId) {
                    return null;
                }

                try {
                    $client = $integration->integrationClient()->getStripeClient();

                    // Fetch subscriptions for the customer
                    $subs = $client->subscriptions->all([
                        'customer' => $customerId,
                        'status' => 'all',
                        'limit' => 10,
                    ]);

                    $active = collect($subs->data ?? [])
                        ->first(fn ($s) => in_array($s->status, ['active', 'trialing']));

                    $current = $active ?: (collect($subs->data ?? [])->first() ?: null);

                    if (! $current) {
                        return [
                            'status' => 'canceled',
                            'plan' => 'No active plan',
                            'price' => '-',
                            'renewsOn' => '-',
                            'trialEndsOn' => null,
                            'id' => null,
                            'currentPeriodStart' => null,
                            'currentPeriodEnd' => null,
                            'cancelAtPeriodEnd' => false,
                            'canceledAt' => null,
                            'collectionMethod' => null,
                            'defaultPaymentMethod' => null,
                        ];
                    }

                    // Re-retrieve the subscription with expansions for richer details
                    $current = $client->subscriptions->retrieve($current->id, [
                        'expand' => ['default_payment_method', 'latest_invoice']
                    ]);

                    $item = $current->items->data[0] ?? null;
                    $price = $item?->price;
                    $nickname = $price?->nickname ?: ($price?->id ?: 'Subscription');
                    $amount = $price?->unit_amount ?? null;
                    $currency = $price?->currency ?? 'usd';
                    $interval = $price?->recurring?->interval ?? null;

                    $priceStr = $amount !== null
                        ? $this->formatCurrency($amount, $currency) . ($interval ? " / {$interval}" : '')
                        : '-';

                    $renewsOn = $current->current_period_end
                        ? Carbon::createFromTimestamp($current->current_period_end)->format('M d, Y')
                        : '-';

                    $defaultPm = $current->default_payment_method ?? null; // expanded if set
                    $defaultPmCard = $defaultPm?->card ?? null;

                    $defaultPmSummary = $defaultPmCard
                        ? sprintf('%s •••• %s (exp %02d/%02d)',$defaultPmCard->brand, $defaultPmCard->last4, (int) $defaultPmCard->exp_month, ((int) $defaultPmCard->exp_year) % 100)
                        : null;

                    // Try to resolve local product/price for nicer display
                    $local = null;
                    try {
                        $localPrice = Price::query()
                            ->where('organization_id', 1)
                            ->where(function ($q) use ($price) {
                                $q->where('gateway_price_id', $price?->id ?? null);
                                if (!empty($price?->lookup_key)) {
                                    $q->orWhere('lookup_key', $price->lookup_key);
                                }
                            })
                            ->with('product')
                            ->first();
                        if ($localPrice) {
                            $cur = method_exists($localPrice->currency, 'getCode') ? $localPrice->currency->getCode() : (string) $localPrice->currency;
                            $amt = method_exists($localPrice->amount, 'getAmount') ? (int) $localPrice->amount->getAmount() : (int) $localPrice->amount;
                            $formattedLocal = $this->formatCurrency($amt, $cur);
                            $local = [
                                'product' => $localPrice->product?->name,
                                'name' => $localPrice->name ?: $localPrice->lookup_key,
                                'display' => trim($formattedLocal . ($localPrice->renew_interval ? (' / ' . $localPrice->renew_interval) : '')),
                            ];
                        }
                    } catch (\Throwable $e) {
                        // ignore local mapping errors
                    }

                    return [
                        'status' => $current->status === 'trialing' ? 'trial' : $current->status,
                        'plan' => $nickname,
                        'price' => $priceStr,
                        'renewsOn' => $renewsOn,
                        'trialEndsOn' => $current->trial_end
                            ? Carbon::createFromTimestamp($current->trial_end)->format('M d, Y')
                            : null,
                        'id' => $current->id,
                        'currentPeriodStart' => $current->current_period_start
                            ? Carbon::createFromTimestamp($current->current_period_start)->format('M d, Y')
                            : null,
                        'currentPeriodEnd' => $current->current_period_end
                            ? Carbon::createFromTimestamp($current->current_period_end)->format('M d, Y')
                            : null,
                        'cancelAtPeriodEnd' => (bool) ($current->cancel_at_period_end ?? false),
                        'canceledAt' => $current->canceled_at
                            ? Carbon::createFromTimestamp($current->canceled_at)->format('M d, Y')
                            : null,
                        'collectionMethod' => $current->collection_method ?? null,
                        'defaultPaymentMethod' => $defaultPmSummary,
                        'local' => $local,
                    ];
                } catch (\Throwable $e) {
                    logger()->error('Stripe subscription fetch failed', ['error' => $e->getMessage()]);
                    return [
                        'status' => 'canceled',
                        'plan' => 'Unavailable',
                        'price' => '-',
                        'renewsOn' => '-',
                        'trialEndsOn' => null,
                        'id' => null,
                        'currentPeriodStart' => null,
                        'currentPeriodEnd' => null,
                        'cancelAtPeriodEnd' => false,
                        'canceledAt' => null,
                        'collectionMethod' => null,
                        'defaultPaymentMethod' => null,
                    ];
                }
            }),
            'subscriptions' => Inertia::defer(function () use ($integration, $customerId) {
                if (! $integration || ! $customerId) {
                    return [];
                }
                try {
                    $client = $integration->integrationClient()->getStripeClient();
                    $subs = $client->subscriptions->all([
                        'customer' => $customerId,
                        'status' => 'all',
                        'limit' => 25,
                    ]);
                    return collect($subs->data ?? [])->map(function ($sub) {
                        $item = $sub->items->data[0] ?? null;
                        $price = $item?->price;
                        return [
                            'id' => $sub->id,
                            'status' => $sub->status,
                            'cancelAtPeriodEnd' => (bool) ($sub->cancel_at_period_end ?? false),
                            'canceledAt' => $sub->canceled_at ? Carbon::createFromTimestamp($sub->canceled_at)->format('M d, Y') : null,
                            'currentPeriodStart' => $sub->current_period_start ? Carbon::createFromTimestamp($sub->current_period_start)->format('M d, Y') : null,
                            'currentPeriodEnd' => $sub->current_period_end ? Carbon::createFromTimestamp($sub->current_period_end)->format('M d, Y') : null,
                            'plan' => [
                                'name' => $price?->nickname ?: ($price?->id ?: 'Subscription'),
                                'amount' => $price?->unit_amount,
                                'currency' => $price?->currency,
                                'interval' => $price?->recurring?->interval,
                            ],
                        ];
                    })->all();
                } catch (\Throwable $e) {
                    logger()->error('Stripe subscriptions list failed', ['error' => $e->getMessage()]);
                    return [];
                }
            }),
            'paymentMethods' => Inertia::defer(function () use ($integration, $customerId) {
                if (! $integration || ! $customerId) {
                    return [];
                }

                try {
                    $client = $integration->integrationClient()->getStripeClient();

                    // Fetch customer with expanded default payment method
                    $cust = $client->customers->retrieve($customerId, [
                        'expand' => ['invoice_settings.default_payment_method'],
                    ]);
                    $defaultPmId = data_get($cust, 'invoice_settings.default_payment_method.id');

                    // List attached card payment methods
                    $pms = $client->paymentMethods->all([
                        'customer' => $customerId,
                        'type' => 'card',
                    ]);

                    return collect($pms->data ?? [])->map(function ($pm) use ($defaultPmId) {
                        $brand = data_get($pm, 'card.brand');
                        $last4 = data_get($pm, 'card.last4');
                        $expMonth = data_get($pm, 'card.exp_month');
                        $expYear = data_get($pm, 'card.exp_year');

                        return [
                            'id' => $pm->id,
                            'brand' => $brand,
                            'last4' => $last4,
                            'exp' => sprintf('%02d/%02d', (int) $expMonth, ((int) $expYear) % 100),
                            'isDefault' => $pm->id === $defaultPmId,
                        ];
                    })->all();
                } catch (\Throwable $e) {
                    logger()->error('Stripe payment methods fetch failed', ['error' => $e->getMessage()]);
                    return [];
                }
            }),
            'invoices' => Inertia::defer(function () use ($integration, $customerId) {
                if (! $integration || ! $customerId) {
                    return [];
                }

                try {
                    $client = $integration->integrationClient()->getStripeClient();

                    $invoices = $client->invoices->all([
                        'customer' => $customerId,
                        'limit' => 12,
                    ]);

                    return collect($invoices->data ?? [])->map(function ($inv) {
                        $amount = data_get($inv, 'amount_paid', data_get($inv, 'amount_due', 0));
                        $currency = data_get($inv, 'currency', 'usd');
                        $created = data_get($inv, 'created');

                        return [
                            'id' => $inv->id,
                            'number' => $inv->number ?? substr($inv->id, -8),
                            'date' => $created ? Carbon::createFromTimestamp($created)->format('M d, Y') : '-',
                            'amount' => $this->formatCurrency($amount, $currency),
                            'status' => $inv->status ?? 'open',
                            'pdfUrl' => $inv->invoice_pdf ?? null,
                            'hostedUrl' => $inv->hosted_invoice_url ?? null,
                        ];
                    })->all();
                } catch (\Throwable $e) {
                    logger()->error('Stripe invoices fetch failed', ['error' => $e->getMessage()]);
                    return [];
                }
            }),
            'payments' => Inertia::defer(function () use ($integration, $customerId) {
                if (! $integration || ! $customerId) {
                    return [];
                }
                try {
                    $client = $integration->integrationClient()->getStripeClient();
                    $charges = $client->charges->all([
                        'customer' => $customerId,
                        'limit' => 25,
                    ]);
                    return collect($charges->data ?? [])->map(function ($c) {
                        return [
                            'id' => $c->id,
                            'amount' => $this->formatCurrency($c->amount, $c->currency),
                            'status' => $c->status,
                            'paid' => (bool) $c->paid,
                            'created' => $c->created ? Carbon::createFromTimestamp($c->created)->format('M d, Y') : null,
                            'description' => $c->description,
                            'receiptUrl' => $c->receipt_url ?? null,
                        ];
                    })->all();
                } catch (\Throwable $e) {
                    logger()->error('Stripe charges fetch failed', ['error' => $e->getMessage()]);
                    return [];
                }
            }),
            'orders' => Inertia::defer(function () use ($customerId) {
                if (! $customerId) {
                    return [];
                }
                try {
                    $local = Customer::query()
                        ->where('organization_id', 1)
                        ->where('reference_id', $customerId)
                        ->first();
                    if (! $local) {
                        return [];
                    }
                    $orders = $local->orders()
                        ->with('items')
                        ->latest()
                        ->limit(50)
                        ->get();
                    return $orders->map(function ($o) {
                        return [
                            'id' => $o->uuid ?? (string) $o->id,
                            'number' => $o->order_number,
                            'status' => (string) ($o->status?->value ?? $o->status),
                            'total' => $this->formatCurrency((int) $o->total_amount, $o->currency ?? 'usd'),
                            'createdAt' => optional($o->created_at)->format('M d, Y'),
                            'receiptUrl' => $o->getReceiptUrl(),
                        ];
                    })->all();
                } catch (\Throwable $e) {
                    logger()->error('Local orders fetch failed', ['error' => $e->getMessage()]);
                    return [];
                }
            }),
            'plans' => Inertia::defer(function () use ($integration, $customerId) {
                $targetCurrency = null;
                $currentAmountMinor = null;
                $currentCurrency = null;
                $excludeLocalProductId = null; // Local product_id if we can resolve mapping
                $excludeGatewayProductId = null; // Stripe product id if available

                // Prefer local customer currency if available
                if ($customerId) {
                    try {
                        $local = Customer::query()
                            ->where('organization_id', 1)
                            ->where('reference_id', $customerId)
                            ->first();
                        if ($local && !empty($local->currency)) {
                            $targetCurrency = (string) $local->currency;
                        }
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }

                // Obtain current subscription details (also used for fallback currency and exclusion)
                if ($integration && $customerId) {
                    try {
                        $client = $integration->integrationClient()->getStripeClient();
                        $subs = $client->subscriptions->all([
                            'customer' => $customerId,
                            'status' => 'all',
                            'limit' => 10,
                        ]);
                        $active = collect($subs->data ?? [])
                            ->first(fn ($s) => in_array($s->status, ['active', 'trialing']));
                        $current = $active ?: (collect($subs->data ?? [])->first() ?: null);
                        if ($current) {
                            $item = $current->items->data[0] ?? null;
                            $price = $item?->price;
                            if ($price) {
                                $excludeGatewayProductId = $price->product ?? null;
                                $currentCurrency = $price->currency ?? null;
                                $currentAmountMinor = isset($price->unit_amount) ? (int) $price->unit_amount : null;

                                // Try to resolve to a local price to find local product_id
                                try {
                                    $localPrice = Price::query()
                                        ->where('organization_id', 1)
                                        ->where(function ($q) use ($price) {
                                            $q->where('gateway_price_id', $price?->id ?? null);
                                            if (!empty($price?->lookup_key)) {
                                                $q->orWhere('lookup_key', $price->lookup_key);
                                            }
                                        })
                                        ->with('product')
                                        ->first();
                                    if ($localPrice && $localPrice->product) {
                                        $excludeLocalProductId = $localPrice->product->id;
                                    }
                                } catch (\Throwable $e) {
                                    // ignore
                                }
                            }
                        }
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }

                // Fallback target currency to subscription currency
                if (! $targetCurrency && $currentCurrency) {
                    $targetCurrency = (string) $currentCurrency;
                }

                $query = Price::query()
                    ->where('organization_id', 1)
                    ->list()
                    ->active();

                if ($targetCurrency) {
                    $upper = strtoupper($targetCurrency);
                    $lower = strtolower($targetCurrency);
                    $query->where(function ($q) use ($upper, $lower) {
                        $q->where('currency', $upper)
                          ->orWhere('currency', $lower);
                    });
                }

                // Exclude products already subscribed to
                if ($excludeLocalProductId) {
                    $query->where('product_id', '!=', $excludeLocalProductId);
                }
                if ($excludeGatewayProductId) {
                    $query->whereHas('product', function ($pq) use ($excludeGatewayProductId) {
                        $pq->where('gateway_product_id', '!=', $excludeGatewayProductId);
                    });
                }

                $plans = $query->orderBy('name')->limit(100)->get();

                return $plans->map(function (Price $p) use ($currentAmountMinor) {
                    $currency = method_exists($p->currency, 'getCode') ? $p->currency->getCode() : (string) $p->currency;
                    $amountMinor = method_exists($p->amount, 'getAmount') ? (int) $p->amount->getAmount() : (int) $p->amount;
                    $formatted = $this->formatCurrency($amountMinor, $currency);
                    $interval = $p->renew_interval ? (' / ' . $p->renew_interval) : '';

                    $direction = null;
                    if (is_int($currentAmountMinor)) {
                        if ($amountMinor > $currentAmountMinor) {
                            $direction = 'upgrade';
                        } elseif ($amountMinor < $currentAmountMinor) {
                            $direction = 'downgrade';
                        } else {
                            $direction = 'same';
                        }
                    }

                    return [
                        'key' => $p->lookup_key,
                        'name' => $p->name ?: $p->lookup_key,
                        'display' => trim($formatted . $interval),
                        'lookup_key' => $p->lookup_key,
                        'gateway_price_id' => $p->gateway_price_id,
                        'direction' => $direction,
                    ];
                })->all();
            }),
        ]);
    }

    /**
     * Decode and validate the billing portal JWT using latest active ApiKey (HS256).
     * Payload must include customer_id; exp is honored by the JWT lib.
     */
    private function decodeCustomerToken(string $jwt): string
    {
        $secret = $this->getJwtSecretFromApiKey();
        if ($secret === null) {
            throw new \RuntimeException('No active API key secret available');
        }

        $decoded = JWT::decode($jwt, new Key($secret, 'HS256'));
        $customerId = (string) ($decoded->customer_id ?? '');
        if ($customerId === '') {
            throw new \RuntimeException('Missing customer_id');
        }
        return $customerId;
    }

    private static function urlsafeB64Decode(string $b64): string
    {
        $remainder = strlen($b64) % 4;
        if ($remainder) {
            $b64 .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($b64, '-_', '+/')) ?: '';
    }

    private function getJwtSecretFromApiKey(): ?string
    {
        $apiKey = ApiKey::query()
            ->where('organization_id', 1)
            ->active()
            ->latest('id')
            ->first();

        if (! $apiKey) {
            return null;
        }

        return (string) $apiKey->key;
    }

    private function generateTestCustomerToken(?string $customerId): ?string
    {
        $secret = $this->getJwtSecretFromApiKey();
        if ($secret === null || empty($customerId)) {
            return null;
        }

        $now = time();
        $payload = [
            'customer_id' => $customerId,
            'iat' => $now,
            'exp' => $now + 3600,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    public function swapPlan(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'string'],
            'price_key' => ['required', 'string'],
            'subscription_id' => ['nullable', 'string'],
        ]);

        $customerId = $data['customer_id'];
        $lookupKey = $data['price_key'];
        $subscriptionId = $data['subscription_id'] ?? null;

        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->firstOrFail();

        $client = $integration->integrationClient()->getStripeClient();

        $targetGatewayPriceId = null;
        $local = Price::query()
            ->where('organization_id', 1)
            ->where('lookup_key', $lookupKey)
            ->active()
            ->first();
        if ($local && $local->gateway_price_id) {
            $targetGatewayPriceId = $local->gateway_price_id;
        } else {
            $prices = $client->prices->search([
                'query' => "active:'true' AND lookup_key:'{$lookupKey}'",
                'limit' => 1,
            ]);
            $targetGatewayPriceId = $prices->data[0]->id ?? null;
        }

        if (! $targetGatewayPriceId) {
            return response()->json(['ok' => false, 'error' => 'Target plan not found'], 422);
        }

        try {
            if ($subscriptionId) {
                $sub = $client->subscriptions->retrieve($subscriptionId);
                $status = $sub->status;

                if ($status === 'canceled') {
                    $updated = $client->subscriptions->create([
                        'customer' => $customerId,
                        'items' => [[ 'price' => $targetGatewayPriceId ]],
                        'payment_settings' => [
                            'save_default_payment_method' => 'on_subscription',
                        ],
                        'expand' => ['latest_invoice.payment_intent'],
                    ]);
                } else {
                    $itemId = $sub->items->data[0]->id ?? null;
                    $params = [
                        'cancel_at_period_end' => false,
                        'proration_behavior' => 'create_prorations',
                        'items' => [[ 'id' => $itemId, 'price' => $targetGatewayPriceId ]],
                        'pause_collection' => null,
                    ];
                    $updated = $client->subscriptions->update($subscriptionId, $params);
                }
            } else {
                $updated = $client->subscriptions->create([
                    'customer' => $customerId,
                    'items' => [[ 'price' => $targetGatewayPriceId ]],
                    'payment_settings' => [
                        'save_default_payment_method' => 'on_subscription',
                    ],
                    'expand' => ['latest_invoice.payment_intent'],
                ]);
            }

            return response()->json([
                'ok' => true,
                'subscription' => [
                    'id' => $updated->id,
                    'status' => $updated->status,
                    'cancel_at_period_end' => (bool) $updated->cancel_at_period_end,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function createSetupIntent(Request $request)
    {
        $request->validate([
            'customer_id' => ['required', 'string'],
        ]);

        $customerId = $request->string('customer_id');
        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->firstOrFail();

        $client = $integration->integrationClient()->getStripeClient();
        $setupIntent = $client->setupIntents->create([
            'customer' => $customerId,
            'payment_method_types' => ['card'],
            'usage' => 'off_session',
        ]);

        return response()->json([
            'publishable_key' => $integration->publishable_key,
            'client_secret' => $setupIntent->client_secret,
        ]);
    }

    public function setDefaultPaymentMethod(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'string'],
            'payment_method_id' => ['required', 'string'],
        ]);

        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->firstOrFail();

        $integration->integrationClient()
            ->setDefaultPaymentMethod($data['customer_id'], $data['payment_method_id']);

        return response()->json(['ok' => true]);
    }

    public function payInvoice(Request $request, string $invoice)
    {
        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->firstOrFail();

        $client = $integration->integrationClient()->getStripeClient();

        try {
            $paidInvoice = $client->invoices->pay($invoice, []);
            return response()->json([
                'ok' => true,
                'status' => $paidInvoice->status,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function invoiceUrl(Request $request, string $invoice)
    {
        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->firstOrFail();

        $client = $integration->integrationClient()->getStripeClient();

        try {
            $inv = $client->invoices->retrieve($invoice);
            $url = $inv->invoice_pdf ?? $inv->hosted_invoice_url ?? null;
            if (! $url) {
                return response()->json(['ok' => false, 'error' => 'No invoice URL available'], 404);
            }
            return response()->json(['ok' => true, 'url' => $url]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    // LOCAL DEV: Generate and immediately decode a test token to verify flow
    public function testToken(Request $request)
    {
        $customerId = (string) ($request->query('customer_id') ?? 'cus_SoZ2vVT96xqqU3');
        $secret = $this->getJwtSecretFromApiKey();
        if ($secret === null) {
            return response()->json([
                'ok' => false,
                'error' => 'No active ApiKey found for organization_id=1',
            ], 422);
        }

        $token = $this->generateTestCustomerToken($customerId);
        if (! $token) {
            return response()->json([
                'ok' => false,
                'error' => 'Failed to generate token',
            ], 422);
        }

        try {
            $decodedCustomerId = $this->decodeCustomerToken($token);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'token' => $token,
                'error' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'ok' => true,
            'token' => $token,
            'decoded_customer_id' => $decodedCustomerId,
            'example_url' => url('/billing/portal') . '?customer=' . urlencode($token),
        ]);
    }

    private function formatCurrency(int|float $amountMinor, string $currency): string
    {
        $symbol = strtoupper($currency);
        $value = number_format(((int) $amountMinor) / 100, 2);
        return "$symbol $value";
    }
}
