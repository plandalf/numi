<?php

namespace App\Models\Order;

use App\Enums\OrderStatus;
use App\Enums\FulfillmentStatus;
use App\Enums\DeliveryMethod;
use App\Models\Catalog\Price;
use App\Models\Store\OfferItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Price $price
 * @property int $id
 * @property int $order_id
 * @property int $price_id
 * @property int $offer_item_id
 * @property int $quantity
 * @property int $total_amount
 * @property array $metadata
 * @property User|null $fulfilledBy
 * @property Carbon $created_at
 * @property Carbon $updated_at
 *
 * @property string $fulfillment_status
 * @property string $delivery_method
 * @property int $quantity_fulfilled
 * @property int $quantity_remaining
 * @property array $fulfillment_data
 * @property array $delivery_assets
 * @property string $tracking_number
 * @property string $tracking_url
 * @property Carbon|null $expected_delivery_date
 * @property Carbon|null $delivered_at
 * @property Carbon|null $fulfilled_at
 * @property int $fulfilled_by_user_id
 * @property string $fulfillment_notes
 * @property string $unprovisionable_reason
 * @property array $external_platform_data
 */
class OrderItem extends Model
{
    use HasFactory;

    protected $table = 'order_items';

    protected $fillable = [
        'order_id',
        'price_id',
        'offer_item_id',
        'quantity',
        'metadata',
        'organization_id',
        'fulfillment_status',
        'delivery_method',
        'quantity_fulfilled',
        'quantity_remaining',
        'fulfillment_data',
        'delivery_assets',
        'tracking_number',
        'tracking_url',
        'expected_delivery_date',
        'delivered_at',
        'fulfilled_at',
        'fulfilled_by_user_id',
        'fulfillment_notes',
        'unprovisionable_reason',
        'external_platform_data',
    ];

    protected $attributes = [
        'status' => OrderStatus::PENDING,
        'delivery_method' => DeliveryMethod::MANUAL_PROVISION,
    ];

    protected $casts = [
        'quantity' => 'integer',
        'metadata' => 'array',
        'fulfillment_status' => FulfillmentStatus::class,
        'delivery_method' => DeliveryMethod::class,
        'quantity_fulfilled' => 'integer',
        'quantity_remaining' => 'integer',
        'fulfillment_data' => 'array',
        'delivery_assets' => 'array',
        'expected_delivery_date' => 'datetime',
        'delivered_at' => 'datetime',
        'fulfilled_at' => 'datetime',
        'external_platform_data' => 'array',
    ];

    /**
     * Get the order that owns the order item.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the price associated with the order item.
     */
    public function price(): BelongsTo
    {
        return $this->belongsTo(Price::class);
    }

    /**
     * Get the offer item associated with the order item.
     */
    public function offerItem(): BelongsTo
    {
        return $this->belongsTo(OfferItem::class, 'offer_item_id');
    }

    /**
     * Get the user who fulfilled this order item.
     */
    public function fulfilledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fulfilled_by_user_id');
    }

    /**
     * Calculate the total amount for this item.
     */
    public function getTotalAmountAttribute(): float
    {
        return $this->price->calculateAmount($this->quantity)->getAmount();
    }

    /**
     * Check if the order item is fully fulfilled.
     */
    public function isFullyFulfilled(): bool
    {
        return $this->quantity_fulfilled >= $this->quantity;
    }

    /**
     * Check if the order item is partially fulfilled.
     */
    public function isPartiallyFulfilled(): bool
    {
        return $this->quantity_fulfilled > 0 && $this->quantity_fulfilled < $this->quantity;
    }

    /**
     * Check if the order item is unfulfilled.
     */
    public function isUnfulfilled(): bool
    {
        return $this->quantity_fulfilled === 0;
    }

    /**
     * Mark the order item as fulfilled.
     */
    public function markAsFulfilled(int $quantity = null, array $fulfillmentData = [], string $notes = null): void
    {
        $quantityToFulfill = $quantity ?? $this->quantity;

        $this->quantity_fulfilled = min($quantityToFulfill, $this->quantity);
        $this->quantity_remaining = $this->quantity - $this->quantity_fulfilled;
        $this->fulfillment_status = $this->isFullyFulfilled() ? FulfillmentStatus::FULFILLED : FulfillmentStatus::PARTIALLY_FULFILLED;
        $this->fulfilled_at = now();
        $this->fulfilled_by_user_id = auth()->id();

        if ($notes) {
            $this->fulfillment_notes = $notes;
        }

        if (!empty($fulfillmentData)) {
            $this->fulfillment_data = array_merge($this->fulfillment_data ?? [], $fulfillmentData);
        }

        $this->save();

        // Update overall order fulfillment status
        $this->order->updateFulfillmentStatus();
    }

    /**
     * Mark the order item as unprovisionable.
     */
    public function markAsUnprovisionable(string $reason): void
    {
        $this->fulfillment_status = FulfillmentStatus::UNPROVISIONABLE;
        $this->unprovisionable_reason = $reason;
        $this->fulfilled_by_user_id = auth()->id();
        $this->save();

        // Update overall order fulfillment status
        $this->order->updateFulfillmentStatus();
    }

    /**
     * Get the fulfillment progress percentage.
     */
    public function getFulfillmentProgressPercentage(): int
    {
        if ($this->quantity === 0) {
            return 0;
        }

        return round(($this->quantity_fulfilled / $this->quantity) * 100);
    }
}
