<?php

namespace App\Jobs;

use App\Models\Checkout\CheckoutSession;
use App\Models\Customer;
use App\Models\Integration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class VerifyJwtStripeCustomerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $checkoutSessionId,
        public int $organizationId,
        public int $integrationId,
        public string $stripeCustomerId,
        public ?string $email = null,
        public ?string $name = null,
        public array $jwtMeta = []
    ) {}

    public function handle(): void
    {
        try {
            $session = CheckoutSession::query()->find($this->checkoutSessionId);
            if (! $session) {
                return;
            }

            // Skip if already associated
            if ($session->customer_id) {
                return;
            }

            $integration = Integration::query()->find($this->integrationId);
            if (! $integration) {
                return;
            }

            $stripeClient = $integration->integrationClient()->getStripeClient();

            // Verify the customer exists in Stripe (will throw if not found)
            $stripeClient->customers->retrieve($this->stripeCustomerId);

            // Create or get local customer
            $local = Customer::query()->firstOrCreate([
                'organization_id' => $this->organizationId,
                'integration_id' => $this->integrationId,
                'reference_id' => (string) $this->stripeCustomerId,
            ], [
                'email' => $this->email,
                'name' => $this->name,
            ]);

            $session->customer_id = $local->id;
            $session->metadata = array_merge($session->metadata ?? [], [
                'jwt' => array_filter([
                    'sub' => $this->jwtMeta['sub'] ?? null,
                    'grp' => $this->jwtMeta['grp'] ?? null,
                    'customer_id' => $this->stripeCustomerId,
                ], fn ($v) => ! is_null($v)),
            ]);
            $session->save();
        } catch (\Throwable $e) {
            Log::warning('VerifyJwtStripeCustomerJob failed', [
                'checkout_session_id' => $this->checkoutSessionId,
                'integration_id' => $this->integrationId,
                'stripe_customer_id' => $this->stripeCustomerId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
