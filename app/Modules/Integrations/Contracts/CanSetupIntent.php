<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Order\Order;

interface CanSetupIntent
{
    public function createSetupIntent(Order $checkoutSession, string $confirmationToken);

    public function getSetupIntent($intentId);
}
