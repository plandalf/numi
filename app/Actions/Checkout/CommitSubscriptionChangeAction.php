<?php

namespace App\Actions\Checkout;

use App\Enums\CheckoutSessionStatus;
use App\Exceptions\CheckoutException;
use App\Models\Checkout\CheckoutSession;
use App\Modules\Integrations\Contracts\SupportsChangePreview;
use Illuminate\Support\Facades\Log;

class CommitSubscriptionChangeAction
{
    public function __invoke(CheckoutSession $session): array
    {
        // Get the preview to understand what change we're committing
        $preview = app(PreviewChangeAdapterAction::class)($session);

        if (! $preview['enabled']) {
            throw CheckoutException::message('Subscription change preview is not available: '.($preview['reason'] ?? 'Unknown error'));
        }

        // Get the integration client
        $integration = $session->integrationClient();

        if (! $integration instanceof SupportsChangePreview) {
            throw CheckoutException::message('Integration does not support subscription changes');
        }

        // Create ChangePreview object from the preview data
        $changePreview = new \App\Modules\Billing\Changes\ChangePreview(
            enabled: $preview['enabled'],
            signal: \App\Enums\SignalID::from($preview['signal']),
            effective: $preview['effective'] ?? [],
            totals: $preview['totals'] ?? [],
            lines: $preview['lines'] ?? [],
            operations: $preview['operations'] ?? [],
            commitDescriptor: $preview['commit_descriptor'] ?? [],
            reason: $preview['reason'] ?? null,
            actions: $preview['actions'] ?? []
        );

        // Commit the change using the integration
        $result = $integration->commitChange($session, $changePreview);

        // Update the checkout session
        $session->update([
            'status' => CheckoutSessionStatus::CLOSED,
            'metadata' => array_merge($session->metadata ?? [], [
                'committed_at' => now()->toISOString(),
                'change_signal' => $preview['signal'],
                'change_result' => $result->toArray(),
            ]),
        ]);

        Log::info('Subscription change committed', [
            'checkout_id' => $session->id,
            'signal' => $preview['signal'],
            'result' => $result->toArray(),
        ]);

        return [
            'message' => 'Subscription change processed successfully',
            'signal' => $preview['signal'],
            'result' => $result->toArray(),
            'checkout_session' => $session->fresh(),
        ];
    }
}
