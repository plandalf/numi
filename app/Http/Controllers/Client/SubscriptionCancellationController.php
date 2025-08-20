<?php

namespace App\Http\Controllers\Client;

use App\Enums\IntegrationType;
use App\Http\Controllers\Controller;
use App\Models\Integration;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionCancellationController extends Controller
{
    public function show(Request $request, string $subscription)
    {
        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->first();

        return Inertia::render('client/cancel-flow', [
            'subscriptionId' => $subscription,
            // steps and offers are customizable; prototype config here
            'flow' => [
                'title' => 'Manage subscription cancellation',
                'steps' => [
                    [
                        'key' => 'reason',
                        'title' => 'Why are you leaving?',
                        'type' => 'single-select',
                        'options' => [
                            ['value' => 'price', 'label' => 'Too expensive'],
                            ['value' => 'features', 'label' => 'Missing features'],
                            ['value' => 'bugs', 'label' => 'Bugs or poor performance'],
                            ['value' => 'other', 'label' => 'Other'],
                        ],
                        'required' => true,
                    ],
                    [
                        'key' => 'details',
                        'title' => 'Tell us more (optional)',
                        'type' => 'textarea',
                        'placeholder' => 'Your feedback helps us improve…',
                        'required' => false,
                    ],
                    [
                        'key' => 'retention',
                        'title' => 'Would one of these help?',
                        'type' => 'offer-select',
                        'required' => false,
                    ],
                    [
                        'key' => 'timing',
                        'title' => 'When should we cancel?',
                        'type' => 'single-select',
                        'options' => [
                            ['value' => 'period_end', 'label' => 'At the end of the current period'],
                            ['value' => 'now', 'label' => 'Immediately'],
                        ],
                        'required' => true,
                    ],
                    [
                        'key' => 'confirm',
                        'title' => 'Confirm cancellation',
                        'type' => 'confirm',
                        'required' => true,
                    ],
                ],
            ],
            'offers' => [
            ],
            'subscription' => Inertia::defer(function () use ($integration, $subscription) {
                if (! $integration) {
                    return null;
                }
                try {
                    $client = $integration->integrationClient()->getStripeClient();
                    $sub = $client->subscriptions->retrieve($subscription, [
                        'expand' => ['default_payment_method', 'latest_invoice']
                    ]);
                    $item = $sub->items->data[0] ?? null;
                    $price = $item?->price;
                    return [
                        'id' => $sub->id,
                        'status' => $sub->status,
                        'currentPeriodEnd' => $sub->current_period_end ? Carbon::createFromTimestamp($sub->current_period_end)->toDateString() : null,
                        'plan' => [
                            'name' => $price?->nickname ?: $price?->id,
                            'amount' => $price?->unit_amount,
                            'currency' => $price?->currency,
                            'interval' => $price?->recurring?->interval,
                        ],
                    ];
                } catch (\Throwable $e) {
                    logger()->error('CancelFlow: fetch subscription failed', ['error' => $e->getMessage()]);
                    return null;
                }
            }, 'cancel'),
        ]);
    }

    public function storeAnswers(Request $request, string $subscription)
    {
        $answers = $request->validate([
            'answers' => ['required', 'array'],
        ])['answers'];

        // TODO: persist to cancellation_sessions
        return response()->json(['ok' => true, 'saved' => true]);
    }

    public function offer(Request $request, string $subscription)
    {
        $payload = $request->validate([
            'offer' => ['required', 'array'],
        ])['offer'];

        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->firstOrFail();

        $client = $integration->integrationClient()->getStripeClient();

        try {
            $updated = null;
            if (($payload['type'] ?? null) === 'coupon') {
                $code = $payload['coupon'] ?? null;
                if (! $code) {
                    return response()->json(['ok' => false, 'error' => 'Missing coupon code'], 422);
                }

                // Try promotion code first
                $promo = $client->promotionCodes->all([
                    'code' => $code,
                    'active' => true,
                    'limit' => 1,
                ])->data[0] ?? null;

                $params = [];
                if ($promo) {
                    $params['promotion_code'] = $promo->id;
                } else {
                    // Fallback to direct coupon id
                    try {
                        $coupon = $client->coupons->retrieve($code);
                        if ($coupon) {
                            $params['coupon'] = $coupon->id;
                        }
                    } catch (\Throwable $e) {
                        // ignore, handled by validation below
                    }
                }

                if (empty($params)) {
                    return response()->json(['ok' => false, 'error' => 'Coupon or promotion code not found'], 422);
                }

                $updated = $client->subscriptions->update($subscription, $params);

            } elseif (($payload['type'] ?? null) === 'downgrade') {
                $lookup = $payload['price_lookup_key'] ?? null;
                if (! $lookup) {
                    return response()->json(['ok' => false, 'error' => 'Missing price lookup key'], 422);
                }

                // Find target price by lookup_key
                $prices = $client->prices->search([
                    'query' => "active:'true' AND lookup_key:'{$lookup}'",
                    'limit' => 1,
                ]);
                $targetPrice = $prices->data[0] ?? null;
                if (! $targetPrice) {
                    return response()->json(['ok' => false, 'error' => 'Target price not found'], 422);
                }

                // Get current subscription to identify item id
                $sub = $client->subscriptions->retrieve($subscription);
                $itemId = $sub->items->data[0]->id ?? null;
                if (! $itemId) {
                    return response()->json(['ok' => false, 'error' => 'Subscription item not found'], 422);
                }

                $updated = $client->subscriptions->update($subscription, [
                    'cancel_at_period_end' => false,
                    'proration_behavior' => 'create_prorations',
                    'items' => [[
                        'id' => $itemId,
                        'price' => $targetPrice->id,
                    ]],
                ]);
            } else {
                return response()->json(['ok' => false, 'error' => 'Unknown offer type'], 422);
            }

            // Summarize for UI
            $summary = [
                'id' => $updated->id,
                'status' => $updated->status,
                'cancel_at_period_end' => (bool) $updated->cancel_at_period_end,
                'current_period_end' => $updated->current_period_end ? Carbon::createFromTimestamp($updated->current_period_end)->toDateString() : null,
            ];

            return response()->json(['ok' => true, 'applied' => $payload, 'subscription' => $summary]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function confirm(Request $request, string $subscription)
    {
        $data = $request->validate([
            'cancel_timing' => ['required', 'in:now,period_end'],
            'answers' => ['nullable', 'array'],
        ]);

        $integration = Integration::query()
            ->where('organization_id', 1)
            ->whereIn('type', [IntegrationType::STRIPE, IntegrationType::STRIPE_TEST])
            ->latest()
            ->firstOrFail();

        $client = $integration->integrationClient()->getStripeClient();

        try {
            if ($data['cancel_timing'] === 'now') {
                $sub = $client->subscriptions->cancel($subscription, []);
            } else {
                $sub = $client->subscriptions->update($subscription, [
                    'cancel_at_period_end' => true,
                ]);
            }

            // TODO: persist answers + outcome for analytics

            return response()->json([
                'ok' => true,
                'status' => $sub->status,
                'cancel_at_period_end' => $sub->cancel_at_period_end,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}


