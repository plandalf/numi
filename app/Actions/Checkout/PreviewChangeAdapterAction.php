<?php

declare(strict_types=1);

namespace App\Actions\Checkout;

use App\Enums\SignalID;
use App\Models\Catalog\Price as CatalogPrice;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Modules\Billing\Changes\ChangeIntent;
use App\Modules\Integrations\Contracts\SupportsSubscriptionPreview;
use Carbon\Carbon;

class PreviewChangeAdapterAction
{
    /**
     * Generalized preview dispatcher for all change types using SignalID.
     * Derives a ChangeIntent by comparing current vs future state, then delegates to PreviewChangeAction.
     *
     * @param  string|null  $effectiveAt  ISO8601 time, or null to infer (trial end → period end → now)
     * @return array<string, mixed>
     */
    public function __invoke(CheckoutSession $session, ?string $effectiveAt = null): array
    {
        // Ensure relations are available
        $session->loadMissing([
            'lineItems.offerItem',
            'lineItems.price.product',
            'organization.integrations',
        ]);

        // Future state (selection in checkout)
        $futureBase = $this->resolveNewBaseRecurringLine($session);
        if (! $futureBase) {
            return [
                'enabled' => false,
                'reason' => 'No recurring base line item found in checkout',
            ];
        }

        // Handle new trial subscription (no existing subscription)
        if (empty($session->subscription)) {
            return $this->handleNewTrialSubscription($session, $futureBase, $effectiveAt);
        }

        // Handle existing subscription changes
        return $this->handleExistingSubscriptionChange($session, $futureBase, $effectiveAt);
    }

    /**
     * Handle new trial subscription preview
     */
    protected function handleNewTrialSubscription(CheckoutSession $session, array $futureBase, ?string $effectiveAt): array
    {
        // For new trials, we show the trial period and what happens after
        $trialDays = 14; // Default trial period
        $trialEnd = now()->addDays($trialDays);

        $intent = new ChangeIntent(
            signal: SignalID::Acquisition,
            targetLocalPriceId: $futureBase['local_price_id'],
            quantityDelta: $this->resolveDesiredQuantity($session, $futureBase['local_price_id']) - 1,
            creditsDelta: null,
            effectiveAt: $effectiveAt,
        );

        // Create a synthetic preview for new trial
        $currency = $futureBase['currency'];
        $amount = $futureBase['amount'];

        return [
            'enabled' => true,
            'signal' => 'Acquisition',
            'effective' => [
                'strategy' => 'trial_start',
                'at' => now()->toISOString(),
                'is_future' => false,
            ],
            'totals' => [
                'due_now' => 0, // No charge during trial
                'currency' => $currency,
            ],
            'lines' => [
                [
                    'id' => null,
                    'description' => '14-day free trial',
                    'amount' => 0,
                    'currency' => $currency,
                    'proration' => false,
                ],
                [
                    'id' => null,
                    'description' => 'After trial: '.$futureBase['product_name'],
                    'amount' => $amount,
                    'currency' => $currency,
                    'proration' => false,
                ],
            ],
            'operations' => [
                [
                    'signal' => 'Acquisition',
                    'current' => [
                        'price' => null,
                        'quantity' => 0,
                    ],
                    'future' => [
                        'price' => $futureBase['gateway_price_id'],
                        'quantity' => $this->resolveDesiredQuantity($session, $futureBase['local_price_id']),
                    ],
                    'delta' => [
                        'currency' => $currency,
                        'amount_due_now' => 0,
                    ],
                ],
            ],
            'commit_descriptor' => [
                'trial_days' => $trialDays,
                'trial_end' => $trialEnd->timestamp,
                'price_id' => $futureBase['gateway_price_id'],
                'quantity' => $this->resolveDesiredQuantity($session, $futureBase['local_price_id']),
            ],
            'actions' => [
                'start_trial' => [
                    'due_now' => 0,
                    'currency' => $currency,
                    'trial_days' => $trialDays,
                    'trial_end' => $trialEnd->toISOString(),
                ],
                'skip_trial' => [
                    'due_now' => $amount,
                    'currency' => $currency,
                ],
            ],
        ];
    }

    /**
     * Handle existing subscription change preview
     */
    protected function handleExistingSubscriptionChange(CheckoutSession $session, array $futureBase, ?string $effectiveAt): array
    {
        // Current state via provider
        $integration = $session->integrationClient();
        if (! $integration instanceof SupportsSubscriptionPreview) {
            return [
                'enabled' => false,
                'reason' => 'Integration cannot retrieve subscriber state to classify signal',
            ];
        }

        $subscription = $integration->retrieveSubscription($session->subscription, [
            'expand' => ['items.data.price.product'],
        ]);

        $currentStatus = (string) ($subscription->status ?? 'unknown');
        $existingItems = $subscription->items->data ?? [];
        $existingBaseItem = $this->resolveExistingBaseItem($existingItems, $futureBase['product_gateway_id'])
            ?? collect($existingItems)->first(function ($item) {
                return ! empty($item->price?->recurring);
            });

        if (! $existingBaseItem) {
            return [
                'enabled' => false,
                'reason' => 'Unable to resolve current base subscription item',
            ];
        }

        $desiredQuantity = $this->resolveDesiredQuantity($session, $futureBase['local_price_id']);
        $currentQuantity = (int) ($existingBaseItem->quantity ?? 1);

        $signal = $this->classifySignal(
            currentStatus: $currentStatus,
            currentPriceAmount: (int) ($existingBaseItem->price->unit_amount ?? 0),
            futurePriceAmount: (int) $futureBase['amount'],
            currentQuantity: $currentQuantity,
            futureQuantity: $desiredQuantity
        );

        $intent = new ChangeIntent(
            signal: $signal,
            targetLocalPriceId: $futureBase['local_price_id'],
            quantityDelta: $desiredQuantity - $currentQuantity,
            creditsDelta: null,
            effectiveAt: $effectiveAt,
        );

        $preview = app(PreviewChangeAction::class)($session, $intent);

        return $preview->toArray();
    }

    /**
     * Find the STANDARD + required recurring line as the base; fallback to any recurring line.
     *
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

        if (! $line) {
            $line = $session->lineItems->first(function (CheckoutLineItem $li) {
                return $li->price && $li->price->type->isSubscription();
            });
        }

        if (! $line) {
            return null;
        }

        $price = $line->price->fresh(['product']);

        return [
            'local_price_id' => $price->id,
            'gateway_price_id' => $price->gateway_price_id,
            'currency' => (string) $price->currency,
            'amount' => $price->amount->getAmount(),
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
                return ! empty($item->price?->recurring)
                    && ($item->price?->product === $targetProductId || $item->price?->product?->id === $targetProductId);
            });

            if ($byProduct) {
                return $byProduct;
            }
        }

        return null;
    }

    private function resolveDesiredQuantity(CheckoutSession $session, int $targetLocalPriceId): int
    {
        $line = $session->lineItems->first(function (CheckoutLineItem $li) use ($targetLocalPriceId) {
            return $li->price && $li->price->id === $targetLocalPriceId;
        });

        return (int) ($line?->quantity ?? 1);
    }

    private function classifySignal(
        string $currentStatus,
        int $currentPriceAmount,
        int $futurePriceAmount,
        int $currentQuantity,
        int $futureQuantity
    ): SignalID {
        $isTrial = $currentStatus === 'trialing';
        $isCanceled = in_array($currentStatus, ['canceled', 'unpaid', 'incomplete_expired'], true);

        if ($isCanceled) {
            return SignalID::Resume;
        }

        if ($isTrial) {
            // During trial: classify plan change vs quantity change
            if ($futurePriceAmount !== $currentPriceAmount) {
                return SignalID::Switch;
            }
            if ($futureQuantity > $currentQuantity) {
                return SignalID::Expansion;
            }
            if ($futureQuantity < $currentQuantity) {
                return SignalID::Contraction;
            }

            return SignalID::Convert;
        }

        if ($futurePriceAmount > $currentPriceAmount) {
            return SignalID::Upgrade;
        }
        if ($futurePriceAmount < $currentPriceAmount) {
            return SignalID::Downgrade;
        }

        if ($futureQuantity > $currentQuantity) {
            return SignalID::Expansion;
        }
        if ($futureQuantity < $currentQuantity) {
            return SignalID::Contraction;
        }

        return SignalID::Renewal;
    }

    protected function resolveEffectiveTimestamp(?string $effectiveAt, ?int $trialEndTs, ?int $periodEndTs): array
    {
        if (! empty($effectiveAt)) {
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

    /**
     * Resolve local price ID by Stripe gateway price id for the session's org.
     */
    protected function resolveLocalPriceId(?string $gatewayPriceId, CheckoutSession $session): ?int
    {
        if (empty($gatewayPriceId)) {
            return null;
        }
        $local = CatalogPrice::query()
            ->where('organization_id', $session->organization_id)
            ->where('gateway_price_id', $gatewayPriceId)
            ->first();

        return $local?->id;
    }
}
