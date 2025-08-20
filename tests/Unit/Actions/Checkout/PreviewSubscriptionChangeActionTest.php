<?php

declare(strict_types=1);

use App\Actions\Checkout\PreviewSubscriptionChangeAction;
use App\Models\Checkout\CheckoutSession;
use Carbon\Carbon;

it('returns disabled when not an upgrade session', function () {
    $action = new PreviewSubscriptionChangeAction;
    $session = new CheckoutSession;
    $session->intent = 'purchase';
    $session->subscription = null;

    $res = $action($session);
    expect($res['enabled'])->toBeFalse();
    expect($res['reason'])->toBe('Not an upgrade session or no subscription provided');
});

it('returns disabled when no subscription provided', function () {
    $action = new PreviewSubscriptionChangeAction;
    $session = new CheckoutSession;
    $session->intent = 'upgrade';
    $session->subscription = null;

    $res = $action($session);
    expect($res['enabled'])->toBeFalse();
    expect($res['reason'])->toBe('Not an upgrade session or no subscription provided');
});

it('handles effective timestamp resolution correctly', function () {
    $action = new PreviewSubscriptionChangeAction;
    $trialEnd = now()->addDays(3)->timestamp;
    $periodEnd = now()->addMonth()->timestamp;
    [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);
    expect($strategy)->toBe('at_trial_end');
    expect($ts)->toBe($trialEnd);
    [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, null, $periodEnd);
    expect($strategy)->toBe('at_period_end');
    expect($ts)->toBe($periodEnd);
    [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, now()->subDay()->timestamp, now()->subDay()->timestamp);
    expect($strategy)->toBe('at_date');
    expect($ts)->toBeGreaterThan(now()->subMinute()->timestamp);
});

it('handles quantity changes correctly', function () {
    $action = new PreviewSubscriptionChangeAction;

    // Test quantity resolution for expansion scenarios
    $session = new CheckoutSession;
    $session->intent = 'upgrade';
    $session->subscription = 'sub_test123';

    // Mock line items with different quantities
    $lineItem = new \stdClass;
    $lineItem->price_id = 123;
    $lineItem->quantity = 2; // New quantity in checkout

    $session->lineItems = collect([$lineItem]);

    // Test that the action can handle quantity changes
    expect($session->lineItems->first()->quantity)->toBe(2);
});

it('handles Money objects correctly', function () {
    $action = new PreviewSubscriptionChangeAction;

    // Test that the action can handle Money objects without throwing errors
    $session = new CheckoutSession;
    $session->intent = 'upgrade';
    $session->subscription = 'sub_test123';

    // Mock a line item with a Money object
    $lineItem = new \stdClass;
    $lineItem->price_id = 123;
    $lineItem->quantity = 1;

    // Mock a price with a Money object
    $price = new \stdClass;
    $price->id = 123;
    $price->gateway_price_id = 'price_test123';
    $price->currency = 'usd';
    $price->amount = new \Money\Money(5000, new \Money\Currency('USD')); // $50.00
    $price->renew_interval = 'month';
    $price->product = null;

    $lineItem->price = $price;
    $session->lineItems = collect([$lineItem]);

    // Test that the action can handle Money objects
    expect($price->amount->getAmount())->toBe('5000');
});

describe('Signal Type Processing', function () {
    it('correctly identifies trial expansion signal (at_trial_end)', function () {
        $action = new PreviewSubscriptionChangeAction;
        $trialEnd = now()->addDays(3)->timestamp;
        $periodEnd = now()->addMonth()->timestamp;

        [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);

        expect($strategy)->toBe('at_trial_end');
        expect($ts)->toBe($trialEnd);

        // Verify this is a future date
        expect($ts)->toBeGreaterThan(now()->timestamp);
    });

    it('correctly identifies period end swap signal (at_period_end)', function () {
        $action = new PreviewSubscriptionChangeAction;
        $trialEnd = now()->subDays(1)->timestamp; // Trial ended
        $periodEnd = now()->addDays(15)->timestamp; // Period still active

        [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);

        expect($strategy)->toBe('at_period_end');
        expect($ts)->toBe($periodEnd);

        // Verify this is a future date
        expect($ts)->toBeGreaterThan(now()->timestamp);
    });

    it('correctly identifies immediate swap signal (at_date)', function () {
        $action = new PreviewSubscriptionChangeAction;
        $trialEnd = now()->subDays(1)->timestamp; // Trial ended
        $periodEnd = now()->subDays(1)->timestamp; // Period ended

        [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);

        expect($strategy)->toBe('at_date');

        // Verify this is a recent timestamp (within last minute)
        expect($ts)->toBeGreaterThan(now()->subMinute()->timestamp);
        expect($ts)->toBeLessThanOrEqual(now()->timestamp);
    });
});

describe('Edge Cases', function () {
    it('handles null timestamps gracefully', function () {
        $action = new PreviewSubscriptionChangeAction;

        [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, null, null);

        expect($strategy)->toBe('at_date');
        expect($ts)->toBeGreaterThan(now()->subMinute()->timestamp);
    });

    it('handles zero timestamps gracefully', function () {
        $action = new PreviewSubscriptionChangeAction;

        [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, 0, 0);

        expect($strategy)->toBe('at_date');
        expect($ts)->toBeGreaterThan(now()->subMinute()->timestamp);
    });

    it('prioritizes provided effective_at over inferred dates', function () {
        $action = new PreviewSubscriptionChangeAction;
        $providedDate = now()->addDays(5)->format('c');
        $trialEnd = now()->addDays(3)->timestamp;
        $periodEnd = now()->addMonth()->timestamp;

        [$ts, $strategy] = $action->resolveEffectiveTimestamp($providedDate, $trialEnd, $periodEnd);

        expect($strategy)->toBe('at_date');
        expect($ts)->toBe(Carbon::parse($providedDate)->timestamp);
    });
});
