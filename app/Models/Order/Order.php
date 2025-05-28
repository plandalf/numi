<?php

namespace App\Models\Order;

use App\Database\Traits\UuidRouteKey;
use App\Enums\OrderStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Collection as DBCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property DBCollection<OrderItem> $items
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
        'uuid',
        'checkout_session_id',
        'status',
        'currency',
        'redirect_url',
        'completed_at',
        'organization_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'completed_at' => 'datetime',
        'status' => OrderStatus::class,
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
}
