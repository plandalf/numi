<?php

namespace App\Actions\Order;

use App\Enums\IntegrationType;
use App\Enums\OrderStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Stripe\Stripe;
use Illuminate\Support\Collection;

class ProcessOrder
{
    public function __invoke(Order $order, CheckoutSession $checkoutSession): Order
    {
        try {
            $order->loadMissing('items.price');
            $orderItems = $order->items;

            /** Group by price type. ex. subscription, one-time, etc. */
            $groupedItems = $orderItems->groupBy(function (OrderItem $item) {
                return $item->price->type->value;
            });

            $integrationClass = get_integration_class(IntegrationType::from($orderItems->first()->price->gateway_provider));
            $groupedItems->each(function (Collection $items, $type) use ($integrationClass) {
                /**
                 * @todo
                 * - Order should have a payment provider
                 * - Can a customer choose a payment provider? ex. card (stripe) or paypal
                 * - Payment provider should be initialized with the order (maybe using the Parental lib)
                 */
                if($integrationClass instanceof CanCreateSubscription) {
                    $integrationClass->createSubscription($items->toArray());
                }
            });

            $checkoutSession->markAsClosed(true);

            return $order;
        } catch (\Exception $e) {
            $checkoutSession->markAsFailed(true);

            throw new \Exception('Error processing order: ' . $e->getMessage());
        }
    }
}
