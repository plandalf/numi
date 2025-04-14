<?php

namespace App\Enums;

enum ChargeType: string
{
    case ONE_TIME = 'one_time';
    case GRADUATED = 'graduated';
    case VOLUME = 'volume';
    case PACKAGE = 'package';

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
     *
     * @return string
     */
    public function label(): string
    {
        return match($this) {
            self::ONE_TIME => 'One Time',
            self::GRADUATED => 'Graduated',
            self::VOLUME => 'Volume',
            self::PACKAGE => 'Package',
        };
    }
}
