<?php

namespace App\Enums;

enum FulfillmentMethod: string
{
    case AUTOMATION = 'automation';
    case API = 'api';
    case MANUAL = 'manual';
    case EXTERNAL_WEBHOOK = 'external_webhook';
    case HYBRID = 'hybrid';

    /**
     * Get all available fulfillment methods as an array of values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get a human-readable label for the fulfillment method.
     */
    public function label(): string
    {
        return match ($this) {
            self::AUTOMATION => 'Automation',
            self::API => 'API',
            self::MANUAL => 'Manual',
            self::EXTERNAL_WEBHOOK => 'External Webhook',
            self::HYBRID => 'Hybrid',
        };
    }

    /**
     * Get the description for the fulfillment method.
     */
    public function description(): string
    {
        return match ($this) {
            self::AUTOMATION => 'Automatically fulfill orders using predefined rules',
            self::API => 'Fulfill orders via API calls to external services',
            self::MANUAL => 'Manually fulfill each order',
            self::EXTERNAL_WEBHOOK => 'Send fulfillment data to external platforms via webhooks',
            self::HYBRID => 'Combination of automatic and manual fulfillment',
        };
    }
} 