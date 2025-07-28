<?php

namespace App\Apps\Plandalf\Triggers;

use App\Workflows\Attributes\IsTrigger;
use App\Workflows\Attributes\Trigger;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;

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
