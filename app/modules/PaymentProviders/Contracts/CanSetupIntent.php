<?php

namespace App\Modules\PaymentProviders\Contracts;

interface CanSetupIntent
{
    public function createSetupIntent();
    public function getSetupIntent($intentId);
}