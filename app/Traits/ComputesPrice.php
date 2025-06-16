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
        return $this->price->calculateAmount(1)->getAmount();
    }

    /**
     * Get the total amount including taxes for this item.
     *
     * @return float
     */
    public function getTotalAttribute(): float
    {
        $total = $this->getTotalAmount();

        if ($this->offerItem->is_tax_inclusive && $this->taxes > 0) {
            $total += $this->taxes;
        }

        return $total;
    }
    /**
     * Get the tax amount for this item.
     *
     * @return float
     */
    public function getTaxesAttribute(): float
    {
        if ($this->offerItem->is_tax_inclusive) {
            return 0;
        }

        $taxRate = $this->offerItem->tax_rate ?? 0;
        $taxAmount = $this->calculateTaxAmount(
            $this->getTotalAmount(),
            $taxRate
        );

        return $taxAmount;
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

    /**
     * Calculate the tax amount based on subtotal and tax rate.
     *
     * @param float $subtotal
     * @param float $taxRate
     * @return float
     */
    private function calculateTaxAmount(float $subtotal, float $taxRate): float
    {
        $taxAmount = $subtotal * ($taxRate / 100);
        return $taxAmount;
    }
} 