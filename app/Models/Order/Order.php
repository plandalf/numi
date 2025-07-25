<?php

namespace App\Models\Order;

use App\Database\Traits\UuidRouteKey;
use App\Enums\OrderStatus;
use App\Enums\FulfillmentMethod;
use App\Models\Checkout\CheckoutSession;
use App\Models\Customer;
use App\Models\OrderEvent;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection as DBCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Organization;
use Illuminate\Support\Facades\URL;

/**
 * @property DBCollection<OrderItem> $items
 * @property string $fulfillment_method
 * @property array  $fulfillment_config
 * @property Carbon $fulfillment_notified
 * @property Carbon $fulfillment_notified_at
 * @property \App\Enums\OrderStatus $status
 * @property \Illuminate\Support\Carbon $completed_at
 * @property Customer|null $customer
 * @property int|null $customer_id
 * @property int $organization_id
 * @property CheckoutSession $checkoutSession
 * @property float $total_amount
 */
class Order extends Model
{
    use HasFactory, UuidRouteKey;

    protected $table = 'orders';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'organization_id',
        'customer_id',
        'status',
        'currency',
        'subtotal',
        'tax_amount',
        'total_amount',
        'intent_id',
        'intent_type',
        'payment_id',
        'payment_method_id',
        'checkout_session_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'completed_at' => 'datetime',
        'status' => OrderStatus::class,
        'fulfillment_method' => FulfillmentMethod::class,
        'fulfillment_config' => 'array',
        'fulfillment_notified' => 'boolean',
        'fulfillment_notified_at' => 'datetime',
    ];

    /**
     * Get the checkout session that owns the order.
     */
    public function checkoutSession(): BelongsTo
    {
        return $this->belongsTo(CheckoutSession::class);
    }

    /**
     * Get the order items for the order.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the events for the order.
     */
    public function events(): HasMany
    {
        return $this->hasMany(OrderEvent::class)->orderBy('created_at', 'desc');
    }

    /**
     * Scope a query to only include completed orders.
     */
    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    /**
     * Scope a query to only include pending orders.
     */
    public function scopePending($query)
    {
        return $query->whereNull('completed_at');
    }

    /**
     * Mark the order as completed.
     */
    public function markAsCompleted(): self
    {
        $this->status = OrderStatus::COMPLETED;
        $this->completed_at = now();

        return $this;
    }

    /**
     * Get the public URL for this order.
     */
    public function getPublicUrl(): string
    {
        return route('orders.public', ['uuid' => $this->uuid]);
    }

    /**
     * Get the signed receipt URL for this order.
     */
    public function getReceiptUrl(): string
    {
        return URL::signedRoute('orders.receipt', ['uuid' => $this->uuid]);
    }

    /**
     * Calculate the total amount for the order based on its items.
     *check
     */
    public function getTotalAmountAttribute(): float
    {
        $subtotal = $this->items->sum('total_amount');

        $discounts = $this->checkoutSession->discounts;

        if (empty($discounts)) {
            return $subtotal;
        }

        $discountAmount = 0;
        foreach ($discounts as $discount) {
            if (isset($discount['percent_off'])) {
                $discountAmount += ($subtotal * ($discount['percent_off'] / 100));
            } elseif (isset($discount['amount_off'])) {
                $discountAmount += $discount['amount_off'];
            }
        }

        return max(0, $subtotal - $discountAmount);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Update the overall order fulfillment status based on items.
     */
    public function updateFulfillmentStatus(): void
    {
        $totalItems = $this->items->count();
        $fulfilledItems = $this->items->where('fulfillment_status', 'fulfilled')->count();
        $partiallyFulfilledItems = $this->items->where('fulfillment_status', 'partially_fulfilled')->count();
        $unprovisionableItems = $this->items->where('fulfillment_status', 'unprovisionable')->count();

        if ($fulfilledItems === $totalItems) {
            $this->status = OrderStatus::COMPLETED;
        } else {
            $this->status = OrderStatus::PENDING;
        }

        $this->save();
    }

    /**
     * Get the fulfillment summary data.
     */
    public function getFulfillmentSummaryAttribute(): array
    {
        $totalItems = $this->items->count();
        $fulfilledItems = $this->items->where('fulfillment_status', 'fulfilled')->count();
        $pendingItems = $this->items->where('fulfillment_status', 'pending')->count();
        $partiallyFulfilledItems = $this->items->where('fulfillment_status', 'partially_fulfilled')->count();
        $unprovisionableItems = $this->items->where('fulfillment_status', 'unprovisionable')->count();

        return [
            'total_items' => $totalItems,
            'fulfilled_items' => $fulfilledItems,
            'pending_items' => $pendingItems + $partiallyFulfilledItems,
            'unprovisionable_items' => $unprovisionableItems,
        ];
    }

    public function setIntent(mixed $id, string $type, ?array $metadata = [])
    {
        $this->intent_id = $id;
        $this->intent_type = $type;
    }
    //intent_id
    //intent_type
    //payment_id
    //payment_method_id

    /**
     * Get the payment method for this order.
     */
    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(\App\Models\PaymentMethod::class);
    }

    /**
     * Get the transaction ID.
     */
    public function getTransactionIdAttribute(): ?string
    {
        return $this->payment_id;
    }

    /**
     * Check if the order has payment information stored.
     */
    public function hasPaymentInformation(): bool
    {
        return !empty($this->payment_id);
    }
}
