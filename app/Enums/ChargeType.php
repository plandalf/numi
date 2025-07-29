<?php

namespace App\Enums;

enum ChargeType: string
{
    case ONE_TIME = 'one_time';
    case GRADUATED = 'graduated';
    case VOLUME = 'volume';
    case PACKAGE = 'package';
    case RECURRING = 'recurring';

    /**
     * Get all available charge types as an array of values.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function recurringTypes()
    {
        return [
            self::GRADUATED,
            self::VOLUME,
            self::PACKAGE,
            self::RECURRING,
        ];
    }

    /**
     * Get a human-readable label for the charge type.
     */
    public function label(): string
    {
        return match ($this) {
            self::ONE_TIME => 'One Time',
            self::GRADUATED => 'Graduated',
            self::VOLUME => 'Volume',
            self::PACKAGE => 'Package',
            self::RECURRING => 'Recurring',
        };
    }

    public function isSubscription(): bool
    {
        return in_array($this, [self::GRADUATED, self::VOLUME, self::PACKAGE, self::RECURRING]);
    }

    public function isOneTime(): bool
    {
        return $this === self::ONE_TIME;
    }
}
