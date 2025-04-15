<?php

namespace App\Modules\PaymentProviders\Stripe;

use App\Modules\PaymentProviders\AbstractPaymentMethod;
use App\Modules\PaymentProviders\Contracts\CanCreateSubscription;
use App\Modules\PaymentProviders\Contracts\CanSetupIntent;

/** @todo implement actual stripe client */
class Stripe extends AbstractPaymentMethod implements CanCreateSubscription, CanSetupIntent
{
    public function __construct(
        protected $client
    ) {
    }

    public function createSetupIntent()
    {
        return $this->client->setupIntents->create();
    }

    public function getSetupIntent($intentId)
    {
        return $this->client->setupIntents->retrieve($intentId);
    }

    public function createSubscription(array $data = [])
    {
        return $this->client->subscriptions->create($data);
    }
}