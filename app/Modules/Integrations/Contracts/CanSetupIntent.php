<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Order\Order;

interface CanSetupIntent
{
    public function createSetupIntent(Order $order, string $confirmationToken);

    public function getSetupIntent($intentId);
}
