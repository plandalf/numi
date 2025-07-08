<?php

namespace App\Enums;

enum ExternalPlatform: string
{
    case SHOPIFY = 'shopify';
    case ETSY = 'etsy';
    case CLICKFUNNELS = 'clickfunnels';
    case WOOCOMMERCE = 'woocommerce';
    case AMAZON = 'amazon';
    case CUSTOM = 'custom';

    /**
     * Get all available external platforms as an array of values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get a human-readable label for the external platform.
     */
    public function label(): string
    {
        return match ($this) {
            self::SHOPIFY => 'Shopify',
            self::ETSY => 'Etsy',
            self::CLICKFUNNELS => 'ClickFunnels',
            self::WOOCOMMERCE => 'WooCommerce',
            self::AMAZON => 'Amazon',
            self::CUSTOM => 'Custom Platform',
        };
    }

    /**
     * Get the webhook endpoints expected for this platform.
     */
    public function webhookEndpoints(): array
    {
        return match ($this) {
            self::SHOPIFY => [
                'order_created' => '/webhooks/shopify/order/created',
                'order_fulfilled' => '/webhooks/shopify/order/fulfilled',
                'fulfillment_created' => '/webhooks/shopify/fulfillment/created',
            ],
            self::ETSY => [
                'order_created' => '/webhooks/etsy/order/created',
                'order_shipped' => '/webhooks/etsy/order/shipped',
            ],
            self::CLICKFUNNELS => [
                'order_created' => '/webhooks/clickfunnels/order/created',
                'order_fulfilled' => '/webhooks/clickfunnels/order/fulfilled',
            ],
            self::WOOCOMMERCE => [
                'order_created' => '/webhooks/woocommerce/order/created',
                'order_completed' => '/webhooks/woocommerce/order/completed',
            ],
            self::AMAZON => [
                'order_created' => '/webhooks/amazon/order/created',
                'order_shipped' => '/webhooks/amazon/order/shipped',
            ],
            self::CUSTOM => [],
        };
    }
} 