<?php

namespace App\Enums;

enum IntegrationType: string
{
    case STRIPE = 'stripe';
    case STRIPE_TEST = 'stripe_test';
    case KAJABI = 'kajabi';

    /**
     * Get all available charge types as an array of values.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get a human-readable label for the charge type.
     */
    public function label(): string
    {
        return match ($this) {
            self::STRIPE => 'Stripe',
            self::STRIPE_TEST => 'Stripe (Test)',
            self::KAJABI => 'Kajabi'
        };
    }
}
