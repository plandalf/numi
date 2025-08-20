<?php

declare(strict_types=1);

use App\Actions\Checkout\PreviewSubscriptionChangeAction;
use App\Models\Checkout\CheckoutSession;
use App\Models\Integration;
use App\Models\Organization;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('PreviewSubscriptionChangeAction Signal Types', function () {

    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->organization = Organization::factory()->create();
        $this->organization->users()->attach($this->user);
    });

    it('returns disabled when not an upgrade session', function () {
        $action = new PreviewSubscriptionChangeAction;
        $session = CheckoutSession::factory()->create([
            'intent' => 'purchase',
            'subscription' => null,
            'organization_id' => $this->organization->id,
        ]);

        $res = $action($session);
        expect($res['enabled'])->toBeFalse();
        expect($res['reason'])->toBe('Not an upgrade session or no subscription provided');
    });

    it('returns disabled when no subscription provided', function () {
        $action = new PreviewSubscriptionChangeAction;
        $session = CheckoutSession::factory()->create([
            'intent' => 'upgrade',
            'subscription' => null,
            'organization_id' => $this->organization->id,
        ]);

        $res = $action($session);
        expect($res['enabled'])->toBeFalse();
        expect($res['reason'])->toBe('Not an upgrade session or no subscription provided');
    });

    describe('Effective Timestamp Resolution', function () {
        it('resolves trial end when available and in future', function () {
            $action = new PreviewSubscriptionChangeAction;
            $trialEnd = now()->addDays(3)->timestamp;
            $periodEnd = now()->addMonth()->timestamp;

            [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);

            expect($strategy)->toBe('at_trial_end');
            expect($ts)->toBe($trialEnd);
        });

        it('resolves period end when trial has ended', function () {
            $action = new PreviewSubscriptionChangeAction;
            $trialEnd = now()->subDays(1)->timestamp;
            $periodEnd = now()->addDays(15)->timestamp;

            [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);

            expect($strategy)->toBe('at_period_end');
            expect($ts)->toBe($periodEnd);
        });

        it('resolves to immediate when both dates are in past', function () {
            $action = new PreviewSubscriptionChangeAction;
            $trialEnd = now()->subDays(1)->timestamp;
            $periodEnd = now()->subDays(1)->timestamp;

            [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);

            expect($strategy)->toBe('at_date');
            expect($ts)->toBeGreaterThan(now()->subMinute()->timestamp);
        });

        it('uses provided effective_at when available', function () {
            $action = new PreviewSubscriptionChangeAction;
            $providedDate = now()->addDays(5)->format('c');
            $trialEnd = now()->addDays(3)->timestamp;
            $periodEnd = now()->addMonth()->timestamp;

            [$ts, $strategy] = $action->resolveEffectiveTimestamp($providedDate, $trialEnd, $periodEnd);

            expect($strategy)->toBe('at_date');
            expect($ts)->toBe(Carbon::parse($providedDate)->timestamp);
        });
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

    describe('Subscription State Handling', function () {
        it('handles different subscription states correctly', function () {
            $action = new PreviewSubscriptionChangeAction;

            // Test various subscription states
            $states = ['active', 'trialing', 'canceled', 'past_due', 'incomplete'];

            foreach ($states as $state) {
                $trialEnd = $state === 'trialing' ? now()->addDays(3)->timestamp : null;
                $periodEnd = now()->addDays(15)->timestamp;

                [$ts, $strategy] = $action->resolveEffectiveTimestamp(null, $trialEnd, $periodEnd);

                if ($state === 'trialing' && $trialEnd > now()->timestamp) {
                    expect($strategy)->toBe('at_trial_end');
                } else {
                    expect($strategy)->toBe('at_period_end');
                }
            }
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
            $providedDate = now()->addDays(10)->format('c');
            $trialEnd = now()->addDays(3)->timestamp;
            $periodEnd = now()->addDays(15)->timestamp;

            [$ts, $strategy] = $action->resolveEffectiveTimestamp($providedDate, $trialEnd, $periodEnd);

            expect($strategy)->toBe('at_date');
            expect($ts)->toBe(Carbon::parse($providedDate)->timestamp);
        });
    });

    describe('Integration with Stripe API', function () {
        it('returns disabled when Stripe integration is not available', function () {
            $action = new PreviewSubscriptionChangeAction;
            $session = CheckoutSession::factory()->create([
                'intent' => 'upgrade',
                'subscription' => 'sub_test',
                'organization_id' => $this->organization->id,
            ]);

            $result = $action($session);

            // Should be disabled because no Stripe integration is configured
            expect($result['enabled'])->toBeFalse();
            expect($result['reason'])->toBe('Stripe integration not available');
        });
    });
});
