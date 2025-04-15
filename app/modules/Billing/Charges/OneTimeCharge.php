<?php

namespace App\Modules\Billing\Charges;

use App\Models\Catalog\Price;
use Money\Money;

class OneTimeCharge extends Price
{
    public function calculateAmount(float $quantity = 1.0): Money
    {
        return $this->amount->multiply($quantity);
    }
}
