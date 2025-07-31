<?php

namespace App\Apps\Plandalf\Triggers;

use App\Workflows\Attributes\IsTrigger;
use App\Workflows\Attributes\Trigger;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;
use App\Models\Order\Order;

#[IsTrigger(
    key: 'order_created',
    noun: 'Order',
    label: 'Order Created',
    description: 'Triggers when a new order is created in Plandalf.',
)]
class OrderCreated extends AppTrigger
{
    public function __invoke(Bundle $bundle): array
    {
        $input = $bundle->input;

        return [
            'order_id' => $input['order_id'] ?? null,
            'offer_id' => $input['offer_id'] ?? null,
            'triggered_at' => $input['triggered_at'] ?? now()->toISOString(),
            'event_type' => $input['event_type'],
        ];
    }

    public function example(Bundle $bundle): array
    {
        // Look up the most recent order for the organization
        $recentOrder = Order::with(['items', 'customer'])
            ->where('organization_id', $bundle->integration?->organization_id ?? auth()->user()?->currentOrganization?->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($recentOrder) {
            return [
                'order_id' => $recentOrder->id,
                'order_uuid' => $recentOrder->uuid,
                'customer_id' => $recentOrder->customer_id,
                'customer_email' => $recentOrder->customer?->email,
                'total_amount' => $recentOrder->total_amount,
                'currency' => $recentOrder->currency,
                'status' => $recentOrder->status->value ?? $recentOrder->status,
                'items_count' => $recentOrder->items->count(),
                'created_at' => $recentOrder->created_at->toISOString(),
                'triggered_at' => now()->toISOString(),
                'event_type' => 'order_created',
                'example' => true,
                'example_note' => 'This is real order data from your most recent order, used as an example for testing.',
            ];
        }

        // Fallback to generic example data if no orders exist
        return [
            'order_id' => 1,
            'order_uuid' => 'order_' . uniqid(),
            'customer_id' => 1,
            'customer_email' => 'customer@example.com',
            'total_amount' => 99.99,
            'currency' => 'USD',
            'status' => 'completed',
            'items_count' => 2,
            'created_at' => now()->subHours(2)->toISOString(),
            'triggered_at' => now()->toISOString(),
            'event_type' => 'order_created',
            'example' => true,
            'example_note' => 'This is sample data for testing purposes. Create some orders to see real examples.',
        ];
    }

    public static function props(): array
    {
        return [
            Field::string('offer', 'Offer')
                ->dynamic('offer.id,name')
                ->multiple()
                ->help('Offer to filter on'),
        ];
    }
}
