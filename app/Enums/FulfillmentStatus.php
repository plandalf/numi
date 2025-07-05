<?php

namespace App\Enums;

enum FulfillmentStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case PARTIALLY_FULFILLED = 'partially_fulfilled';
    case FULFILLED = 'fulfilled';
    case CANCELLED = 'cancelled';
    case FAILED = 'failed';
    case ON_HOLD = 'on_hold';
    case UNPROVISIONABLE = 'unprovisionable';

    /**
     * Get all available fulfillment statuses as an array of values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get a human-readable label for the fulfillment status.
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::PROCESSING => 'Processing',
            self::PARTIALLY_FULFILLED => 'Partially Fulfilled',
            self::FULFILLED => 'Fulfilled',
            self::CANCELLED => 'Cancelled',
            self::FAILED => 'Failed',
            self::ON_HOLD => 'On Hold',
            self::UNPROVISIONABLE => 'Unprovisionable',
        };
    }

    /**
     * Get the color associated with the status for UI display.
     */
    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'yellow',
            self::PROCESSING => 'blue',
            self::PARTIALLY_FULFILLED => 'orange',
            self::FULFILLED => 'green',
            self::CANCELLED => 'red',
            self::FAILED => 'red',
            self::ON_HOLD => 'gray',
            self::UNPROVISIONABLE => 'red',
        };
    }
} 