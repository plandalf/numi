<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Carbon;
use Stripe\Stripe;
use Stripe\Subscription as StripeSubscription;
use Illuminate\Support\Arr;

class CheckoutCompletionController extends Controller
{
    public function show(Request $request, string $checkoutId)
    {
        // Get checkout data from Plandalf
        $checkoutData = $this->getCheckoutFromPlandalf($checkoutId);
        
        // Get current organization
        $organization = auth()->user()->currentOrganization;

        // Extract Stripe customer ID from checkout data
        $stripeCustomerId = Arr::get($checkoutData, 'customer.reference_id');

        // Sync Stripe subscriptions to local Cashier models
        $this->syncStripeSubscriptionsToLocal($organization, $stripeCustomerId);

        // Reload organization with fresh subscription data after sync
        $organization->refresh();
        $organization->load('subscriptions.items');

        return redirect()
            ->route('organizations.settings.billing.index')
            ->with('success', 'Subscription updated successfully');
    }

    /**
     * Get checkout data from Plandalf API
     */
    private function getCheckoutFromPlandalf(string $checkoutId): array
    {
        $apiToken = 'live_t255nBTR9vN4xVrHZdwkftjJBKveQReW';

        $response = Http::baseUrl('http://localhost:8001/api/')
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])
            ->withToken($apiToken)
            ->get('checkouts/' . $checkoutId);

        return $response->json();
    }

    /**
     * Sync Stripe subscriptions to local Cashier models
     */
    private function syncStripeSubscriptionsToLocal(Organization $organization, ?string $stripeCustomerId): void
    {
        if (!$stripeCustomerId) {
            return;
        }

        // Set Stripe API key
        Stripe::setApiKey(config('cashier.secret'));

        // Ensure organization has Stripe customer ID
        if (!$organization->hasStripeId()) {
            $organization->stripe_id = $stripeCustomerId;
            $organization->save();
        }

        // Fetch all subscriptions from Stripe
        $stripeSubscriptions = StripeSubscription::all([
            'customer' => $stripeCustomerId,
            'limit' => 100,
        ]);

        foreach ($stripeSubscriptions->data as $stripeSubscription) {
            $this->handleCustomerSubscriptionUpdated($organization, $stripeSubscription->toArray());
        }
    }

    /**
     * Handle customer subscription updated - exact copy from Cashier WebhookController
     */
    protected function handleCustomerSubscriptionUpdated(Organization $organization, array $data): void
    {
        $subscription = $organization->subscriptions()->firstOrNew(['stripe_id' => $data['id']]);

        if (
            isset($data['status']) &&
            $data['status'] === StripeSubscription::STATUS_INCOMPLETE_EXPIRED
        ) {
            $subscription->items()->delete();
            $subscription->delete();

            return;
        }

        $subscription->type = $subscription->type ?? $data['metadata']['type'] ?? $data['metadata']['name'] ?? 'default';

        $firstItem = $data['items']['data'][0];
        $isSinglePrice = count($data['items']['data']) === 1;

        // Price...
        $subscription->stripe_price = $isSinglePrice ? $firstItem['price']['id'] : null;

        // Quantity...
        $subscription->quantity = $isSinglePrice && isset($firstItem['quantity']) ? $firstItem['quantity'] : null;

        // Trial ending date...
        if (isset($data['trial_end'])) {
            $trialEnd = Carbon::createFromTimestamp($data['trial_end']);

            if (! $subscription->trial_ends_at || $subscription->trial_ends_at->ne($trialEnd)) {
                $subscription->trial_ends_at = $trialEnd;
            }
        }

        // Cancellation date...
        if ($data['cancel_at_period_end'] ?? false) {
            $subscription->ends_at = $subscription->onTrial()
                ? $subscription->trial_ends_at
                : Carbon::createFromTimestamp($data['current_period_end']);
        } elseif (isset($data['cancel_at']) || isset($data['canceled_at'])) {
            $subscription->ends_at = Carbon::createFromTimestamp($data['cancel_at'] ?? $data['canceled_at']);
        } else {
            $subscription->ends_at = null;
        }

        // Status...
        if (isset($data['status'])) {
            $subscription->stripe_status = $data['status'];
        }

        $subscription->save();

        // Update subscription items...
        if (isset($data['items'])) {
            $subscriptionItemIds = [];

            foreach ($data['items']['data'] as $item) {
                $subscriptionItemIds[] = $item['id'];

                $subscription->items()->updateOrCreate([
                    'stripe_id' => $item['id'],
                ], [
                    'stripe_product' => $item['price']['product'],
                    'stripe_price' => $item['price']['id'],
                    'quantity' => $item['quantity'] ?? null,
                ]);
            }

            // Delete items that aren't attached to the subscription anymore...
            $subscription->items()->whereNotIn('stripe_id', $subscriptionItemIds)->delete();
        }
    }
} 