<?php

namespace App\Modules\PaymentProviders\Contracts;

interface CanCreateSubscription
{
    public function createSubscription(array $data = []);
}
