<?php

namespace App\Enums;

enum DeliveryMethod: string
{
    case PHYSICAL_SHIPPING = 'physical_shipping';
    case DIGITAL_DOWNLOAD = 'digital_download';
    case EMAIL_DELIVERY = 'email_delivery';
    case API_PROVISIONING = 'api_provisioning';
    case MANUAL_PROVISION = 'manual_provision';
    case VIRTUAL_DELIVERY = 'virtual_delivery';
    case INSTANT_ACCESS = 'instant_access';
    case EXTERNAL_PLATFORM = 'external_platform';

    /**
     * Get all available delivery methods as an array of values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get a human-readable label for the delivery method.
     */
    public function label(): string
    {
        return match ($this) {
            self::PHYSICAL_SHIPPING => 'Physical Shipping',
            self::DIGITAL_DOWNLOAD => 'Digital Download',
            self::EMAIL_DELIVERY => 'Email Delivery',
            self::API_PROVISIONING => 'API Provisioning',
            self::MANUAL_PROVISION => 'Manual Provision',
            self::VIRTUAL_DELIVERY => 'Virtual Delivery',
            self::INSTANT_ACCESS => 'Instant Access',
            self::EXTERNAL_PLATFORM => 'External Platform',
        };
    }

    /**
     * Check if this delivery method requires manual intervention.
     */
    public function isManual(): bool
    {
        return match ($this) {
            self::MANUAL_PROVISION => true,
            self::PHYSICAL_SHIPPING => true,
            default => false,
        };
    }

    /**
     * Check if this delivery method is automated.
     */
    public function isAutomated(): bool
    {
        return match ($this) {
            self::API_PROVISIONING => true,
            self::INSTANT_ACCESS => true,
            self::DIGITAL_DOWNLOAD => true,
            self::EMAIL_DELIVERY => true,
            default => false,
        };
    }
} 