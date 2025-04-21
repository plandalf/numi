<?php

namespace App\Modules\Integrations\Stripe;

use App\Modules\Integrations\AbstractIntegration;
use App\Modules\Integrations\Contracts\CanCreateSubscription;
use App\Modules\Integrations\Contracts\CanSetupIntent;

/** @todo implement actual stripe client */
class Stripe extends AbstractIntegration implements CanCreateSubscription, CanSetupIntent
{
    public function __construct() {
    }

    public function createSetupIntent()
    {
        // return $this->client->setupIntents->create();
    }

    public function getSetupIntent($intentId)
    {
        // return $this->client->setupIntents->retrieve($intentId);
    }

    public function createSubscription(array $data = [])
    {
        // return $this->client->subscriptions->create($data);
    }
}