<?php

namespace App\Traits;

trait ComputesPrice
{
    /**
     * Get the subtotal amount for this item.
     *
     * @return float
     */
    public function getSubtotalAttribute(): float
    {
        return $this->price->calculateAmount($this->quantity)->getAmount();
    }

    /**
     * Get the total amount including taxes for this item.
     *
     * @return float
     */
    public function getTotalAttribute(): float
    {
        return $this->getTotalAmount();
    }

    // /**
    //  * Get the tax amount for this item.
    //  *
    //  * @return float
    //  */
    // public function getTaxesAttribute(): float
    // {
    //     $inclusiveTaxes = $this->getInclusiveTaxesAttribute();

    //     if(!$this->offerItem->is_tax_inclusive) {
    //         return $inclusiveTaxes + $taxAmount;
    //     }

    //     return $inclusiveTaxes;
    // }

    // public function getExclusiveTaxesAttribute(): float
    // {
    //     $taxRate = $this->offerItem->tax_rate ?? 0;
    //     return $this->calculateTaxAmount(
    //         $this->getTotalAmount(),
    //         $taxRate
    //     );
    // }

    public function getInclusiveTaxesAttribute(): float
    {
        switch($this->currency) {
            default:
                return round($this->getTotalAmount()-$this->getTotalAmount()/1.1);
        }
    }

    /**
     * Get the total amount for this item.
     *
     * @return float
     */
    private function getTotalAmount(): float
    {
        return $this->price->calculateAmount($this->quantity)->getAmount();
    }

    // /**
    //  * Calculate the tax amount based on subtotal and tax rate.
    //  *
    //  * @param float $subtotal
    //  * @param float $taxRate
    //  * @return float
    //  */
    // private function calculateTaxAmount(float $subtotal, float $taxRate): float
    // {
    //     $taxAmount = $subtotal * ($taxRate / 100);
    //     return $taxAmount;
    // }
} 