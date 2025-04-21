<?php

namespace App\Modules\Billing\Charges;

use App\Models\Catalog\Price;
use Money\Money;
use Parental\HasParent;

class OneTimeCharge extends Price
{
    use HasParent;

    public function calculateAmount(float $quantity = 1.0): Money
    {
        return $this->amount->multiply($quantity);
    }
}
