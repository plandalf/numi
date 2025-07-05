<?php

namespace App\Actions\Fulfillment;

use App\Enums\ExternalPlatform;
use App\Enums\FulfillmentStatus;
use App\Models\ExternalFulfillment;
use App\Models\Organization;
use Illuminate\Support\Facades\Log;

class ProcessExternalFulfillmentAction
{
    /**
     * Process external fulfillment from webhook data.
     */
    public function execute(Organization $organization, ExternalPlatform $platform, array $webhookData): ExternalFulfillment
    {
        $externalOrderId = $this->extractOrderId($platform, $webhookData);
        
        $externalFulfillment = ExternalFulfillment::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'platform' => $platform,
                'external_order_id' => $externalOrderId,
            ],
            [
                'status' => $this->determineStatus($webhookData),
                'order_data' => $this->extractOrderData($platform, $webhookData),
                'fulfillment_data' => $this->extractFulfillmentData($platform, $webhookData),
                'customer_data' => $this->extractCustomerData($platform, $webhookData),
                'items_data' => $this->extractItemsData($platform, $webhookData),
                'tracking_number' => $this->extractTrackingNumber($platform, $webhookData),
                'tracking_url' => $this->extractTrackingUrl($platform, $webhookData),
                'external_order_created_at' => $this->extractOrderCreatedAt($platform, $webhookData),
                'external_fulfilled_at' => $this->extractFulfilledAt($platform, $webhookData),
                'external_delivered_at' => $this->extractDeliveredAt($platform, $webhookData),
                'webhook_headers' => request()->headers->all(),
                'webhook_signature' => request()->header('X-Webhook-Signature'),
            ]
        );
        
        Log::info('External fulfillment processed', [
            'external_fulfillment_id' => $externalFulfillment->id,
            'platform' => $platform->value,
            'external_order_id' => $externalOrderId,
            'status' => $externalFulfillment->status->value,
        ]);
        
        return $externalFulfillment;
    }

    /**
     * Extract order ID from webhook data based on platform.
     */
    private function extractOrderId(ExternalPlatform $platform, array $data): string
    {
        return match ($platform) {
            ExternalPlatform::SHOPIFY => $data['id'] ?? $data['order_id'] ?? '',
            ExternalPlatform::ETSY => $data['receipt_id'] ?? '',
            ExternalPlatform::CLICKFUNNELS => $data['order']['id'] ?? '',
            ExternalPlatform::WOOCOMMERCE => $data['id'] ?? '',
            ExternalPlatform::AMAZON => $data['AmazonOrderId'] ?? '',
            ExternalPlatform::CUSTOM => $data['order_id'] ?? $data['id'] ?? '',
        };
    }

    /**
     * Determine fulfillment status from webhook data.
     */
    private function determineStatus(array $data): FulfillmentStatus
    {
        $status = $data['status'] ?? $data['fulfillment_status'] ?? 'pending';
        
        return match (strtolower($status)) {
            'fulfilled', 'completed', 'shipped', 'delivered' => FulfillmentStatus::FULFILLED,
            'processing', 'in_transit', 'pending_fulfillment' => FulfillmentStatus::PROCESSING,
            'partially_fulfilled', 'partial' => FulfillmentStatus::PARTIALLY_FULFILLED,
            'cancelled', 'canceled' => FulfillmentStatus::CANCELLED,
            'failed', 'error' => FulfillmentStatus::FAILED,
            'on_hold', 'hold' => FulfillmentStatus::ON_HOLD,
            default => FulfillmentStatus::PENDING,
        };
    }

    /**
     * Extract order data from webhook based on platform.
     */
    private function extractOrderData(ExternalPlatform $platform, array $data): array
    {
        return match ($platform) {
            ExternalPlatform::SHOPIFY => [
                'order_number' => $data['order_number'] ?? null,
                'total_price' => $data['total_price'] ?? null,
                'currency' => $data['currency'] ?? null,
                'financial_status' => $data['financial_status'] ?? null,
                'fulfillment_status' => $data['fulfillment_status'] ?? null,
            ],
            ExternalPlatform::ETSY => [
                'receipt_id' => $data['receipt_id'] ?? null,
                'total_price' => $data['grandtotal'] ?? null,
                'currency_code' => $data['currency_code'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
            ],
            ExternalPlatform::CLICKFUNNELS => [
                'order_id' => $data['order']['id'] ?? null,
                'total_amount' => $data['order']['total_amount'] ?? null,
                'currency' => $data['order']['currency'] ?? null,
                'status' => $data['order']['status'] ?? null,
            ],
            default => $data,
        };
    }

    /**
     * Extract fulfillment data from webhook.
     */
    private function extractFulfillmentData(ExternalPlatform $platform, array $data): ?array
    {
        if (isset($data['fulfillment'])) {
            return $data['fulfillment'];
        }
        
        if (isset($data['fulfillments'])) {
            return $data['fulfillments'];
        }
        
        return null;
    }

    /**
     * Extract customer data from webhook.
     */
    private function extractCustomerData(ExternalPlatform $platform, array $data): ?array
    {
        return match ($platform) {
            ExternalPlatform::SHOPIFY => $data['customer'] ?? null,
            ExternalPlatform::ETSY => [
                'buyer_user_id' => $data['buyer_user_id'] ?? null,
                'buyer_email' => $data['buyer_email'] ?? null,
            ],
            ExternalPlatform::CLICKFUNNELS => $data['contact'] ?? null,
            default => $data['customer'] ?? null,
        };
    }

    /**
     * Extract items data from webhook.
     */
    private function extractItemsData(ExternalPlatform $platform, array $data): ?array
    {
        return match ($platform) {
            ExternalPlatform::SHOPIFY => $data['line_items'] ?? null,
            ExternalPlatform::ETSY => $data['transactions'] ?? null,
            ExternalPlatform::CLICKFUNNELS => $data['order']['order_items'] ?? null,
            default => $data['items'] ?? $data['line_items'] ?? null,
        };
    }

    /**
     * Extract tracking number from webhook.
     */
    private function extractTrackingNumber(ExternalPlatform $platform, array $data): ?string
    {
        return $data['tracking_number'] ?? 
               $data['fulfillment']['tracking_number'] ?? 
               $data['tracking_info']['tracking_number'] ?? 
               null;
    }

    /**
     * Extract tracking URL from webhook.
     */
    private function extractTrackingUrl(ExternalPlatform $platform, array $data): ?string
    {
        return $data['tracking_url'] ?? 
               $data['fulfillment']['tracking_url'] ?? 
               $data['tracking_info']['tracking_url'] ?? 
               null;
    }

    /**
     * Extract order created timestamp.
     */
    private function extractOrderCreatedAt(ExternalPlatform $platform, array $data): ?\Carbon\Carbon
    {
        $createdAt = $data['created_at'] ?? $data['order_date'] ?? null;
        
        return $createdAt ? \Carbon\Carbon::parse($createdAt) : null;
    }

    /**
     * Extract fulfilled timestamp.
     */
    private function extractFulfilledAt(ExternalPlatform $platform, array $data): ?\Carbon\Carbon
    {
        $fulfilledAt = $data['fulfilled_at'] ?? 
                       $data['fulfillment']['created_at'] ?? 
                       $data['shipped_at'] ?? 
                       null;
        
        return $fulfilledAt ? \Carbon\Carbon::parse($fulfilledAt) : null;
    }

    /**
     * Extract delivered timestamp.
     */
    private function extractDeliveredAt(ExternalPlatform $platform, array $data): ?\Carbon\Carbon
    {
        $deliveredAt = $data['delivered_at'] ?? 
                       $data['delivery_date'] ?? 
                       null;
        
        return $deliveredAt ? \Carbon\Carbon::parse($deliveredAt) : null;
    }
} 