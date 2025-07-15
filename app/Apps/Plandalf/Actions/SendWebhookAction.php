<?php

namespace App\Apps\Plandalf\Actions;

use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;

#[\App\Workflows\Attributes\Action(
    key: 'send-webhook',
    noun: 'Webhook',
    label: 'Send Webhook',
    description: 'Sends a webhook to a specified URL.',
)]
class SendWebhookAction extends AppAction
{

    public function __invoke(Bundle $bundle): array
    {
        // TODO: Implement __invoke() method.
    }
}
