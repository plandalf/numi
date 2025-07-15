<?php

namespace App\Apps\Plandalf;

use App\Apps\AutomationApp;
use App\Apps\Plandalf\Actions\SendEmailAction;
use App\Apps\Plandalf\Actions\SendWebhookAction;
use App\Apps\Plandalf\Triggers\OrderCreated;
use App\Apps\Plandalf\Triggers\WebhookTrigger;

class PlandalfApp extends AutomationApp
{
    public function actions(): array
    {
        return [
            SendEmailAction::class,
            SendWebhookAction::class,
        ];
    }

    public function triggers(): array
    {
        return [
            WebhookTrigger::class,
            OrderCreated::class,
        ];
    }
}
