<?php

namespace App\Apps\Plandalf;

use App\Apps\AutomationApp;
use App\Apps\Plandalf\Actions\SendEmailAction;
use App\Apps\Plandalf\Actions\SendWebhookAction;
use App\Apps\Plandalf\Actions\SendReceiptAction;
use App\Apps\Plandalf\Resources\OfferResource;
use App\Apps\Plandalf\Triggers\OrderCreated;
use App\Apps\Plandalf\Triggers\WebhookTrigger;
use App\Workflows\Attributes\IsAutomation;

#[IsAutomation(
    key: 'plandalf',
    name: 'Plandalf',
    description: 'Connect your Plandalf site to automate member management, order processing, and course delivery.',
    version: '1.0.0',
    provider_url: 'https://plandalf.com',
)]
class PlandalfApp extends AutomationApp
{
    public function actions(): array
    {
        return [
            SendEmailAction::class,
            SendWebhookAction::class,
            SendReceiptAction::class,
        ];
    }

    public function triggers(): array
    {
        return [
            WebhookTrigger::class,
            OrderCreated::class,
        ];
    }

    public function resources(): array
    {
        return [
            OfferResource::class,
        ];
    }
}
