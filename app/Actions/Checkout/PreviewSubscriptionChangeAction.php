<?php

declare(strict_types=1);

namespace App\Actions\Checkout;

use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Modules\Integrations\Stripe\Stripe;
use Carbon\Carbon;

class PreviewSubscriptionChangeAction
{
    /**
     * Compute a preview of the delta (proration, immediate or future invoice impact) for changing the base plan.
     * - Only swaps the base plan (STANDARD + required item) to the new recurring price
     * - Keeps other subscription items (addons) as-is
     * - Supports trial-aware and period-end future effective times
     *
     * @param  CheckoutSession  $session
     * @param  string|null  $effectiveAt ISO8601 time, or null to infer (trial end → period end → now)
     * @return array<string, mixed>
     */
    public function __invoke(CheckoutSession $session, ?string $effectiveAt = null): array
    {
        if ($session->intent !== 'upgrade' || empty($session->subscription)) {
            return [
                'enabled' => false,
                'reason' => 'Not an upgrade session or no subscription provided',
            ];
        }

        // Ensure relations are available without hammering the DB if already loaded
        $session->loadMissing([
            'lineItems.offerItem',
            'lineItems.price.product',
            'organization.integrations',
        ]);

        $integrationClient = $session->integrationClient();
        if (!$integrationClient instanceof Stripe) {
            return [
                'enabled' => false,
                'reason' => 'Stripe integration not available',
            ];
        }

        $stripe = $integrationClient->getStripeClient();

        try {
            $subscription = $stripe->subscriptions->retrieve($session->subscription, [
                'expand' => ['items.data.price.product'],
            ]);
        } catch (\Throwable $e) {
            return [
                'enabled' => false,
                'reason' => 'Failed to retrieve subscription: '.$e->getMessage(),
            ];
        }

        $currentStatus = $subscription->status ?? null;
        $trialEndTs = $this->tsOrNull($subscription->trial_end ?? null);
        $periodEndTs = $this->tsOrNull($subscription->current_period_end ?? null);

        // Decide effective timestamp and strategy
        [$effectiveTs, $strategy] = $this->resolveEffectiveTimestamp($effectiveAt, $trialEndTs, $periodEndTs);

        // Determine the new base plan from checkout
        $newBase = $this->resolveNewBaseRecurringLine($session);
        if (!$newBase) {
            return [
                'enabled' => false,
                'reason' => 'No recurring base line item found in checkout',
                'current_status' => $currentStatus,
            ];
        }

        $existingItems = $subscription->items->data ?? [];
        $existingBaseItem = $this->resolveExistingBaseItem($existingItems, $newBase['product_gateway_id'])
            ?? collect($existingItems)->first(function ($item) {
                return !empty($item->price?->recurring);
            });

        if (!$existingBaseItem) {
            return [
                'enabled' => false,
                'reason' => 'No suitable existing base subscription item to swap',
                'current_status' => $currentStatus,
            ];
        }

        // Build items: keep addons, swap base price only
        $subItemsPreview = [];
        foreach ($existingItems as $item) {
            $subItemsPreview[] = array_filter([
                'id' => $item->id,
                'price' => $item->id === $existingBaseItem->id ? $newBase['gateway_price_id'] : ($item->price->id ?? null),
                'quantity' => $item->quantity ?? 1,
            ]);
        }

        // Build upcoming invoice preview
        $params = array_filter([
            'subscription' => $subscription->id ?? null,
            'subscription_items' => $subItemsPreview,
            'subscription_proration_behavior' => 'create_prorations',
            'subscription_proration_date' => $effectiveTs,
            'customer' => $subscription->customer ?? null,
            'subscription_trial_end' => ($trialEndTs && $effectiveTs === $trialEndTs) ? $trialEndTs : null,
            'expand' => ['discounts', 'lines.data.discounts', 'lines.data.price.product'],
        ]);

        try {
            $upcoming = $stripe->invoices->upcoming($params);
        } catch (\Throwable $e) {
            return [
                'enabled' => false,
                'reason' => 'Stripe preview failed: '.$e->getMessage(),
                'current_status' => $currentStatus,
            ];
        }

        $lines = collect($upcoming->lines->data ?? []);
        $prorationLines = $lines->filter(function ($line) {
            return (bool)($line->proration ?? false);
        });

        $prorationSubtotal = (int)$prorationLines->sum('amount');
        $totalDueAtEffective = (int)($upcoming->amount_due ?? 0);
        $currency = strtolower($upcoming->currency ?? ($session->currency ?? 'usd'));

        return [
            'enabled' => true,
            'effective' => [
                'strategy' => $strategy, // at_trial_end|at_period_end|at_date
                'at' => Carbon::createFromTimestamp($effectiveTs)->toISOString(),
                'is_future' => $effectiveTs > now()->timestamp,
            ],
            'current' => [
                'status' => $currentStatus,
                'subscription_id' => $subscription->id ?? null,
                'base_item' => [
                    'stripe_price' => $existingBaseItem->price->id ?? null,
                    'product' => [
                        'id' => $existingBaseItem->price->product?->id ?? $existingBaseItem->price->product ?? null,
                        'name' => $existingBaseItem->price->product?->name ?? null,
                    ],
                ],
                'trial_end' => $trialEndTs ? Carbon::createFromTimestamp($trialEndTs)->toISOString() : null,
                'period_end' => $periodEndTs ? Carbon::createFromTimestamp($periodEndTs)->toISOString() : null,
            ],
            'proposed' => [
                'base_item' => [
                    'price_id' => $newBase['local_price_id'],
                    'stripe_price' => $newBase['gateway_price_id'],
                    'interval' => $newBase['interval'],
                    'currency' => strtolower($newBase['currency']),
                    'amount' => (int)$newBase['amount'],
                    'product' => [
                        'id' => $newBase['product_gateway_id'],
                        'name' => $newBase['product_name'],
                    ],
                ],
            ],
            'delta' => [
                'proration_subtotal' => $prorationSubtotal,
                'total_due_at_effective' => $totalDueAtEffective,
                'currency' => $currency,
            ],
            'invoice_preview' => [
                'lines' => $lines->map(function ($l) {
                    return [
                        'id' => $l->id ?? null,
                        'description' => $l->description ?? null,
                        'amount' => (int)($l->amount ?? 0),
                        'currency' => $l->currency ?? null,
                        'proration' => (bool)($l->proration ?? false),
                        'period' => $l->period ?? null,
                        'price' => [
                            'id' => $l->price?->id ?? null,
                            'recurring' => $l->price?->recurring ?? null,
                            'product' => [
                                'id' => $l->price?->product?->id ?? $l->price?->product ?? null,
                                'name' => $l->price?->product?->name ?? null,
                            ],
                        ],
                    ];
                })->values()->all(),
            ],
        ];
    }

    /**
     * Find the STANDARD + required recurring line as the base; fallback to any recurring line.
     * @return array{local_price_id:int, gateway_price_id:?string, currency:string, amount:int, interval:?string, product_gateway_id:?string, product_name:?string}|null
     */
    protected function resolveNewBaseRecurringLine(CheckoutSession $session): ?array
    {
        /** @var CheckoutLineItem|null $line */
        $line = $session->lineItems
            ->filter(function (CheckoutLineItem $li) {
                return $li->offerItem
                    && $li->offerItem->type === \App\Enums\Store\OfferItemType::STANDARD
                    && $li->offerItem->is_required
                    && $li->price
                    && $li->price->type->isSubscription();
            })
            ->first();

        if (!$line) {
            $line = $session->lineItems->first(function (CheckoutLineItem $li) {
                return $li->price && $li->price->type->isSubscription();
            });
        }

        if (!$line) {
            return null;
        }

        $price = $line->price->fresh(['product']);

        return [
            'local_price_id' => $price->id,
            'gateway_price_id' => $price->gateway_price_id,
            'currency' => (string)$price->currency,
            'amount' => (int)$price->amount,
            'interval' => $price->renew_interval,
            'product_gateway_id' => $price->product?->gateway_product_id,
            'product_name' => $price->product?->name,
        ];
    }

    /**
     * Match existing base subscription item by product where possible.
     *
     * @param  array<int, mixed>  $items
     */
    protected function resolveExistingBaseItem(array $items, ?string $targetProductId)
    {
        if ($targetProductId) {
            $byProduct = collect($items)->first(function ($item) use ($targetProductId) {
                return !empty($item->price?->recurring)
                    && ($item->price?->product === $targetProductId || $item->price?->product?->id === $targetProductId);
            });

            if ($byProduct) {
                return $byProduct;
            }
        }

        return null;
    }

    protected function resolveEffectiveTimestamp(?string $effectiveAt, ?int $trialEndTs, ?int $periodEndTs): array
    {
        if (!empty($effectiveAt)) {
            try {
                $ts = Carbon::parse($effectiveAt)->timestamp;
                return [$ts, 'at_date'];
            } catch (\Throwable) {
                // fall through
            }
        }

        if ($trialEndTs && $trialEndTs > now()->timestamp) {
            return [$trialEndTs, 'at_trial_end'];
        }

        if ($periodEndTs && $periodEndTs > now()->timestamp) {
            return [$periodEndTs, 'at_period_end'];
        }

        return [now()->timestamp, 'at_date'];
    }

    protected function tsOrNull($value): ?int
    {
        if (empty($value)) {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        try {
            return Carbon::parse((string) $value)->timestamp;
        } catch (\Throwable) {
            return null;
        }
    }
}


