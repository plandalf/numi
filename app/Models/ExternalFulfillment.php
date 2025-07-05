<?php

namespace App\Models;

use App\Enums\ExternalPlatform;
use App\Enums\FulfillmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalFulfillment extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'platform',
        'external_order_id',
        'external_fulfillment_id',
        'status',
        'order_data',
        'fulfillment_data',
        'customer_data',
        'items_data',
        'tracking_number',
        'tracking_url',
        'external_order_created_at',
        'external_fulfilled_at',
        'external_delivered_at',
        'webhook_signature',
        'webhook_headers',
        'notes',
    ];

    protected $casts = [
        'platform' => ExternalPlatform::class,
        'status' => FulfillmentStatus::class,
        'order_data' => 'array',
        'fulfillment_data' => 'array',
        'customer_data' => 'array',
        'items_data' => 'array',
        'webhook_headers' => 'array',
        'external_order_created_at' => 'datetime',
        'external_fulfilled_at' => 'datetime',
        'external_delivered_at' => 'datetime',
    ];

    /**
     * Get the organization that owns the external fulfillment.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Mark the external fulfillment as fulfilled.
     */
    public function markAsFulfilled(array $fulfillmentData = []): void
    {
        $this->status = FulfillmentStatus::FULFILLED;
        $this->external_fulfilled_at = now();
        
        if (!empty($fulfillmentData)) {
            $this->fulfillment_data = array_merge($this->fulfillment_data ?? [], $fulfillmentData);
        }
        
        $this->save();
    }

    /**
     * Mark the external fulfillment as delivered.
     */
    public function markAsDelivered(): void
    {
        $this->status = FulfillmentStatus::FULFILLED;
        $this->external_delivered_at = now();
        $this->save();
    }

    /**
     * Update tracking information.
     */
    public function updateTracking(string $trackingNumber, string $trackingUrl = null): void
    {
        $this->tracking_number = $trackingNumber;
        $this->tracking_url = $trackingUrl;
        $this->save();
    }

    /**
     * Get the platform-specific webhook endpoints.
     */
    public function getWebhookEndpoints(): array
    {
        return $this->platform->webhookEndpoints();
    }
} 