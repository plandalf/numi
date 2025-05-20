<?php

namespace App\Modules\Billing\Charges;

use App\Models\Catalog\Price;
use Illuminate\Support\Arr;
use Money\Money;
use Parental\HasParent;

class VolumeCharge extends Price
{
    use HasParent;

    public function calculateAmount(float $quantity = 1.0): Money
    {
        $applicableTier = $this->getApplicableTier($quantity);

        $unitAmount = new Money($applicableTier['unit_amount'], $this->currency);
        $total = $unitAmount->multiply($quantity);

        if (isset($applicableTier['flat_amount']) && $applicableTier['flat_amount'] !== null) {
            $flatAmount = new Money($applicableTier['flat_amount'], $this->currency);
            $total = $total->add($flatAmount);
        }

        return $total;
    }

    private function getApplicableTier(float $quantity): array
    {
        $applicableTier = Arr::last($this->properties);

        foreach ($this->properties as $tier) {
            if ($tier['up_to'] === null || $quantity <= $tier['up_to']) {
                $applicableTier = $tier;
                break;
            }
        }

        return $applicableTier;
    }
}
