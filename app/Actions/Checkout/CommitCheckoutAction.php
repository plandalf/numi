<?php

namespace App\Actions\Checkout;

use App\Actions\Order\CreateOrderAction;
use App\Actions\Order\CreateOrderItemAction;
use App\Actions\Order\ProcessOrderAction;
use App\Enums\CheckoutSessionStatus;
use App\Exceptions\CheckoutException;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use App\Models\PaymentMethod;
use App\Workflows\Automation\Events\SystemEvent;
use Illuminate\Support\Facades\Log;

class CommitCheckoutAction
{
    public function __construct(
        private readonly CreateOrderAction $createOrderAction,
        private readonly CreateOrderItemAction $createOrderItemAction,
    ) {}

    public function __invoke(CheckoutSession $session): Order|array
    {
        // Check if this is a subscription change (upgrade/expansion/etc.)
        if ($session->intent === 'upgrade' && $session->subscription) {
            $commitChange = app(CommitSubscriptionChangeAction::class);

            return $commitChange($session);
        }

        if ($session->intent_type === 'free') {
            $intent = null;
        } elseif ($session->intent_type === 'payment') {
            $intent = $session->paymentsIntegration
                ->integrationClient()
                ->getStripeClient()
                ->paymentIntents
                ->retrieve($session->intent_id, [
                    'expand' => ['payment_method', 'latest_charge'],
                ]);
        } elseif ($session->intent_type === 'setup') {
            $intent = $session->paymentsIntegration
                ->integrationClient()
                ->getStripeClient()
                ->setupIntents
                ->retrieve($session->intent_id, [
                    'expand' => ['payment_method'],
                ]);
        } else {
            Log::warning(logname('fail.intent_type'), [
                'checkout_id' => $session->id,
                'intent_type' => $session->intent_type,
            ]);

            throw CheckoutException::message('Invalid intent type, please check payment details');
        }

        if (filled($intent)) {
            $paymentMethod = PaymentMethod::query()
                ->firstOrCreate([
                    'customer_id' => $session->customer_id,
                    'organization_id' => $session->organization_id,
                    'integration_id' => $session->payments_integration_id,
                    'external_id' => $intent->payment_method->id,
                ], [
                    'type' => $intent->payment_method->type,
                    'properties' => $intent->payment_method->{$intent->payment_method->type},
                    'metadata' => $intent->payment_method->metadata,
                    'can_redisplay' => $intent->payment_method->allow_redisplay !== 'limited',
                    'billing_details' => $intent->payment_method->billing_details->toArray(),
                ]);
            $session->payment_method_id = $paymentMethod->id;
            $session->save();

        }

        $process = app(ProcessOrderAction::class, ['session' => $session]);

        // If the checkout session is already closed, return it
        if ($session->status === CheckoutSessionStatus::CLOSED || $session->status === CheckoutSessionStatus::FAILED) {
            Log::warning(logname('skip.checkout_closed'), [
                'checkout_id' => $session->id,
                'status' => $session->status,
            ]);

            return $process($session->order);
        }

        $order = ($this->createOrderAction)($session);

        // Create order items from checkout line items
        foreach ($session->lineItems as $lineItem) {
            ($this->createOrderItemAction)($order, $lineItem);
        }

        $processed = $process($order);

        event(
            new SystemEvent(
                type: 'order_created',
                app: 'plandalf',
                organization: $order->organization,
                props: [
                    'order_id' => $order->id,
                    'offer_id' => $order->checkoutSession->offer_id,
                    'triggered_at' => now()->toISOString(),
                    'event_type' => 'order_created',
                ]
            )
        );

        $session->markAsClosed(true);

        $session->update([
            'payment_confirmed_at' => now(),
            'payment_method_locked' => true,
        ]);

        // Mark payment as confirmed locally
        $session->update([
            'status' => CheckoutSessionStatus::CLOSED,
            'metadata' => array_merge($session->metadata ?? [], [
                'committed_at' => now()->toISOString(),
            ]),
        ]);

        return $processed;
    }
}
