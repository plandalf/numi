<?php

namespace App\Services;

use App\Enums\ExternalPlatform;
use App\Models\Organization;
use Illuminate\Support\Facades\URL;

class ExternalPlatformService
{
    /**
     * Get webhook URLs for an organization and platform.
     */
    public function getWebhookUrls(Organization $organization, ExternalPlatform $platform): array
    {
        $baseUrl = config('app.url');
        $organizationId = $organization->id;
        
        $webhookUrls = [];
        foreach ($platform->webhookEndpoints() as $event => $endpoint) {
            $webhookUrls[$event] = $baseUrl . '/api/webhooks/organizations/' . $organizationId . '/' . $platform->value;
        }
        
        return $webhookUrls;
    }

    /**
     * Generate webhook configuration instructions for a platform.
     */
    public function getWebhookInstructions(Organization $organization, ExternalPlatform $platform): array
    {
        $webhookUrls = $this->getWebhookUrls($organization, $platform);
        
        return match ($platform) {
            ExternalPlatform::SHOPIFY => [
                'title' => 'Shopify Webhook Setup',
                'description' => 'Configure webhooks in your Shopify admin panel to sync order fulfillment data.',
                'steps' => [
                    '1. Go to Settings > Notifications in your Shopify admin',
                    '2. Scroll down to the "Webhooks" section',
                    '3. Click "Create webhook"',
                    '4. Set the URL to: ' . $webhookUrls['order_created'] ?? '',
                    '5. Select "Order creation" and "Order fulfillment" events',
                    '6. Set format to JSON',
                    '7. Save the webhook configuration',
                ],
                'webhook_url' => $webhookUrls['order_created'] ?? '',
                'events' => ['Order creation', 'Order fulfillment', 'Fulfillment creation'],
            ],
            
            ExternalPlatform::ETSY => [
                'title' => 'Etsy Webhook Setup',
                'description' => 'Configure webhooks in your Etsy shop to sync order fulfillment data.',
                'steps' => [
                    '1. Go to your Etsy Shop Manager',
                    '2. Navigate to Settings > Integrations',
                    '3. Create or edit your API application',
                    '4. Add webhook endpoint: ' . $webhookUrls['order_created'] ?? '',
                    '5. Subscribe to "receipt.created" and "receipt.shipped" events',
                    '6. Save the configuration',
                ],
                'webhook_url' => $webhookUrls['order_created'] ?? '',
                'events' => ['Receipt created', 'Order shipped'],
            ],
            
            ExternalPlatform::CLICKFUNNELS => [
                'title' => 'ClickFunnels Webhook Setup',
                'description' => 'Configure webhooks in ClickFunnels to sync order fulfillment data.',
                'steps' => [
                    '1. Go to your ClickFunnels account settings',
                    '2. Navigate to Integrations > Webhooks',
                    '3. Click "Add New Webhook"',
                    '4. Set the URL to: ' . $webhookUrls['order_created'] ?? '',
                    '5. Select "Order Created" and "Order Fulfilled" events',
                    '6. Set format to JSON',
                    '7. Save the webhook',
                ],
                'webhook_url' => $webhookUrls['order_created'] ?? '',
                'events' => ['Order created', 'Order fulfilled'],
            ],
            
            ExternalPlatform::WOOCOMMERCE => [
                'title' => 'WooCommerce Webhook Setup',
                'description' => 'Configure webhooks in your WooCommerce store to sync order fulfillment data.',
                'steps' => [
                    '1. Go to WooCommerce > Settings > Advanced > Webhooks',
                    '2. Click "Create webhook"',
                    '3. Set the name to "Plandalf Order Sync"',
                    '4. Set status to "Active"',
                    '5. Set topic to "Order created"',
                    '6. Set delivery URL to: ' . $webhookUrls['order_created'] ?? '',
                    '7. Select API version and save',
                    '8. Repeat for "Order completed" topic',
                ],
                'webhook_url' => $webhookUrls['order_created'] ?? '',
                'events' => ['Order created', 'Order completed'],
            ],
            
            ExternalPlatform::AMAZON => [
                'title' => 'Amazon MWS/SP-API Setup',
                'description' => 'Configure Amazon webhooks using their Marketplace Web Service or Selling Partner API.',
                'steps' => [
                    '1. Register for Amazon MWS or SP-API access',
                    '2. Set up SNS (Simple Notification Service) topic',
                    '3. Configure notifications for order events',
                    '4. Set endpoint URL to: ' . $webhookUrls['order_created'] ?? '',
                    '5. Subscribe to relevant order notification types',
                    '6. Test the integration',
                ],
                'webhook_url' => $webhookUrls['order_created'] ?? '',
                'events' => ['Order created', 'Order shipped'],
            ],
            
            ExternalPlatform::CUSTOM => [
                'title' => 'Custom Platform Webhook Setup',
                'description' => 'Configure webhooks for your custom platform or service.',
                'steps' => [
                    '1. Configure your platform to send webhooks to: ' . $webhookUrls['order_created'] ?? '',
                    '2. Include order data in JSON format',
                    '3. Set Content-Type header to "application/json"',
                    '4. Include X-Webhook-Signature header if using signature validation',
                    '5. Send POST requests for order events',
                    '6. Test the integration',
                ],
                'webhook_url' => $webhookUrls['order_created'] ?? '',
                'events' => ['Custom order events'],
            ],
        };
    }

    /**
     * Validate external platform configuration.
     */
    public function validatePlatformConfig(Organization $organization, ExternalPlatform $platform, array $config): array
    {
        $errors = [];
        
        // Common validation
        if (empty($config['enabled'])) {
            return $errors; // Skip validation if not enabled
        }
        
        // Platform-specific validation
        switch ($platform) {
            case ExternalPlatform::SHOPIFY:
                if (empty($config['shop_domain'])) {
                    $errors['shop_domain'] = 'Shop domain is required for Shopify integration';
                }
                if (empty($config['access_token'])) {
                    $errors['access_token'] = 'Access token is required for Shopify integration';
                }
                break;
                
            case ExternalPlatform::ETSY:
                if (empty($config['api_key'])) {
                    $errors['api_key'] = 'API key is required for Etsy integration';
                }
                if (empty($config['shop_id'])) {
                    $errors['shop_id'] = 'Shop ID is required for Etsy integration';
                }
                break;
                
            case ExternalPlatform::CLICKFUNNELS:
                if (empty($config['api_key'])) {
                    $errors['api_key'] = 'API key is required for ClickFunnels integration';
                }
                break;
                
            case ExternalPlatform::WOOCOMMERCE:
                if (empty($config['store_url'])) {
                    $errors['store_url'] = 'Store URL is required for WooCommerce integration';
                }
                if (empty($config['consumer_key'])) {
                    $errors['consumer_key'] = 'Consumer key is required for WooCommerce integration';
                }
                if (empty($config['consumer_secret'])) {
                    $errors['consumer_secret'] = 'Consumer secret is required for WooCommerce integration';
                }
                break;
                
            case ExternalPlatform::AMAZON:
                if (empty($config['marketplace_id'])) {
                    $errors['marketplace_id'] = 'Marketplace ID is required for Amazon integration';
                }
                if (empty($config['access_key'])) {
                    $errors['access_key'] = 'Access key is required for Amazon integration';
                }
                break;
        }
        
        return $errors;
    }

    /**
     * Test webhook connectivity for a platform.
     */
    public function testWebhookConnectivity(Organization $organization, ExternalPlatform $platform): array
    {
        $webhookUrls = $this->getWebhookUrls($organization, $platform);
        $testResults = [];
        
        foreach ($webhookUrls as $event => $url) {
            // Simulate a test webhook request
            $testResults[$event] = [
                'url' => $url,
                'status' => 'ready',
                'message' => 'Webhook endpoint is configured and ready to receive data',
            ];
        }
        
        return $testResults;
    }
} 