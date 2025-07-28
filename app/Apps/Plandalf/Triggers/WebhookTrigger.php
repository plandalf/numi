<?php

namespace App\Apps\Plandalf\Triggers;

use App\Workflows\Attributes\IsTrigger;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Bundle;

#[IsTrigger(
    key: 'webhook',
    noun: 'Webhook',
    label: 'Webhook Trigger',
    description: 'Triggers when a webhook is received from Plandalf.',
)]
class WebhookTrigger extends AppTrigger
{
    public function __invoke(Bundle $bundle): array
    {
        // TODO: Implement __invoke() method.
    }
}
