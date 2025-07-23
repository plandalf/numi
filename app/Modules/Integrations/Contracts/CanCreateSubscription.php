<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Order\Order;

interface CanCreateSubscription
{
    public function createSubscription(Order $order);
}
