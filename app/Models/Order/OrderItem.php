<?php

namespace App\Models\Order;

use App\Enums\OrderStatus;
use App\Models\Catalog\Price;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Price $price
 */
class OrderItem extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'order_items';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_id',
        'price_id',
        'slot_id',
        'quantity',
        'metadata',
        'organization_id',
    ];

    protected $attributes = [
        'status' => OrderStatus::PENDING,
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'metadata' => 'array',
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
     * Calculate the total amount for this item.
     */
    public function getTotalAmountAttribute(): float
    {
        return $this->price->calculateAmount($this->quantity)->getAmount();
    }
}
