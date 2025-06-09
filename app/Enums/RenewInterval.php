<?php

namespace App\Enums;

enum RenewInterval: string
{
    case DAY = 'day';
    case WEEK = 'week';
    case MONTH = 'month';
    case YEAR = 'year';

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
            self::DAY => 'Day',
            self::WEEK => 'Week',
            self::MONTH => 'Month',
            self::YEAR => 'Year',
        };
    }
}
