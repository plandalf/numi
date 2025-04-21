<?php

namespace App\Modules\Integrations\Contracts;

interface CanCreateSubscription
{
    public function createSubscription(array $data = []);
}
