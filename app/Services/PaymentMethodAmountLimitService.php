<?php

namespace App\Services;

class PaymentMethodAmountLimitService
{
    /**
     * Payment method amount limits in cents
     * Based on Stripe's documentation and common BNPL provider limits
     */
    private const PAYMENT_METHOD_LIMITS = [
        'afterpay_clearpay' => [
            'usd' => 200000, // $2,000 USD
            'cad' => 250000, // $2,500 CAD
            'aud' => 300000, // $3,000 AUD
            'nzd' => 300000, // $3,000 NZD
            'gbp' => 150000, // £1,500 GBP
            'eur' => 180000, // €1,800 EUR
        ],
        'affirm' => [
            'usd' => 175000, // $1,750 USD
            'cad' => 200000, // $2,000 CAD
        ],
        'klarna' => [
            'usd' => 100000, // $1,000 USD
            'eur' => 100000, // €1,000 EUR
            'gbp' => 80000,  // £800 GBP
            'aud' => 150000, // $1,500 AUD
            'cad' => 120000, // $1,200 CAD
            'chf' => 100000, // CHF 1,000
            'czk' => 2500000, // 25,000 CZK
            'dkk' => 750000, // 7,500 DKK
            'nok' => 1000000, // 10,000 NOK
            'nzd' => 150000, // $1,500 NZD
            'pln' => 4000000, // 40,000 PLN
            'ron' => 5000000, // 50,000 RON
            'sek' => 1000000, // 10,000 SEK
        ],
        'zip' => [
            'usd' => 100000, // $1,000 USD
            'aud' => 150000, // $1,500 AUD
        ],
    ];

    /**
     * Check if a payment method is available for the given amount and currency
     */
    public function isPaymentMethodAvailableForAmount(string $paymentMethod, int $amountInCents, string $currency): bool
    {
        $currency = strtolower($currency);

        // If no limit is defined for this payment method, it's available
        if (!isset(self::PAYMENT_METHOD_LIMITS[$paymentMethod])) {
            return true;
        }

        // If no limit is defined for this currency, it's available
        if (!isset(self::PAYMENT_METHOD_LIMITS[$paymentMethod][$currency])) {
            return true;
        }

        $limit = self::PAYMENT_METHOD_LIMITS[$paymentMethod][$currency];

        return $amountInCents <= $limit;
    }

    /**
     * Filter payment methods based on amount and currency
     */
    public function filterPaymentMethodsByAmount(array $paymentMethods, int $amountInCents, string $currency): array
    {
        return array_filter($paymentMethods, function ($method) use ($amountInCents, $currency) {
            return $this->isPaymentMethodAvailableForAmount($method, $amountInCents, $currency);
        });
    }

    /**
     * Get the amount limit for a specific payment method and currency
     */
    public function getPaymentMethodLimit(string $paymentMethod, string $currency): ?int
    {
        $currency = strtolower($currency);
        
        return self::PAYMENT_METHOD_LIMITS[$paymentMethod][$currency] ?? null;
    }

    /**
     * Get all payment methods that have amount limits
     */
    public function getPaymentMethodsWithLimits(): array
    {
        return array_keys(self::PAYMENT_METHOD_LIMITS);
    }

    /**
     * Format amount limit for display
     */
    public function formatAmountLimit(int $amountInCents, string $currency): string
    {
        $amount = $amountInCents / 100;
        
        return match (strtolower($currency)) {
            'usd' => '$' . number_format($amount, 2),
            'cad' => 'C$' . number_format($amount, 2),
            'aud' => 'A$' . number_format($amount, 2),
            'nzd' => 'NZ$' . number_format($amount, 2),
            'gbp' => '£' . number_format($amount, 2),
            'eur' => '€' . number_format($amount, 2),
            'chf' => 'CHF ' . number_format($amount, 2),
            'czk' => number_format($amount, 0) . ' CZK',
            'dkk' => number_format($amount, 0) . ' DKK',
            'nok' => number_format($amount, 0) . ' NOK',
            'pln' => number_format($amount, 0) . ' PLN',
            'ron' => number_format($amount, 0) . ' RON',
            'sek' => number_format($amount, 0) . ' SEK',
            default => number_format($amount, 2) . ' ' . strtoupper($currency),
        };
    }
} 