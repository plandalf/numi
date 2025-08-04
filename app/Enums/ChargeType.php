<?php

namespace App\Enums;

enum ChargeType: string
{
    case ONE_TIME = 'one_time';
    case RECURRING = 'recurring';
    case TIERED = 'tiered';
    case VOLUME = 'volume';
    case GRADUATED = 'graduated';
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

    public static function recurringTypes()
    {
        return [
            self::RECURRING,
            self::TIERED,
            self::VOLUME,
            self::GRADUATED,
            self::PACKAGE,
        ];
    }

    /**
     * Get a human-readable label for the charge type.
     */
    public function label(): string
    {
        return match ($this) {
            self::ONE_TIME => 'One Time',
            self::RECURRING => 'Recurring',
            self::TIERED => 'Tiered',
            self::VOLUME => 'Volume',
            self::GRADUATED => 'Graduated',
            self::PACKAGE => 'Package',
        };
    }

    public function isSubscription(): bool
    {
        return in_array($this, [self::RECURRING, self::TIERED, self::VOLUME, self::GRADUATED, self::PACKAGE]);
    }

    public function isOneTime(): bool
    {
        return $this === self::ONE_TIME;
    }
}
