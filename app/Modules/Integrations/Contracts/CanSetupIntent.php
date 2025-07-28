<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Order\Order;

interface CanSetupIntent
{
    public function getSetupIntent($intentId);
}
