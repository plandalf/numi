<?php

namespace App\Listeners;

use App\Enums\Stripe\WebhookEvent;
use App\Models\Organization;
use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(WebhookReceived $event): void
    {
        if ($event->payload['type'] === WebhookEvent::INVOICE_PAYMENT_FAILED) {
            $this->invoicePaymentFailed($event->payload);
        }
    }

    public function invoicePaymentFailed(array $payload): void
    {
        $organization = $this->getBillableModel($payload);

        if ($organization && $organization->subscribed('default')) {
            $organization->subscription('default')->cancel(); // Cancel current paid sub
            $organization->newSubscription('default', config('cashier.free_price_id'))->create(); // Downgrade to free
        }
    }

    protected function getBillableModel(array $payload): Organization
    {
        $stripeCustomerId = $payload['data']['object']['customer'];
        $organization = Organization::where('stripe_id', $stripeCustomerId)->first();

        return $organization;
    }
}
