<?php

namespace App\Modules\Integrations\Contracts;

interface CanSetupIntent
{
    public function createSetupIntent();
    public function getSetupIntent($intentId);
}