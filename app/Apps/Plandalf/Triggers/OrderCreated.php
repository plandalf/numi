<?php

namespace App\Apps\Plandalf\Triggers;

use App\Workflows\Attributes\Trigger;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Bundle;

#[Trigger(
    key: 'order_created',
    noun: 'Order',
    label: 'Order Created',
    description: 'Triggers when a new order is created in Plandalf.',
)]
class OrderCreated extends AppTrigger
{

    public function __invoke(Bundle $bundle): array
    {
        // TODO: Implement __invoke() method.
    }
}
