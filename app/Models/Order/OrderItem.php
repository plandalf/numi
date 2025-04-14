<?php

namespace App\Models\Order;

use App\Enums\OrderStatus;
use App\Models\Catalog\Price;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'total_amount',
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
        'total_amount' => 'integer',
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
     *
     * @return float
     */
    public function calculateTotalAmount(): float
    {
        if ($this->price) {
            return $this->price->amount * $this->quantity;
        }

        return 0.0;
    }

    /**
     * Update the total amount for this item.
     *
     * @return bool
     */
    public function updateTotalAmount(): bool
    {
        return $this->update([
            'total_amount' => $this->calculateTotalAmount(),
        ]);
    }

    /**
     * Get the formatted total amount.
     *
     * @return string
     */
    public function getFormattedTotalAmount(): string
    {
        return number_format($this->total_amount, 2);
    }
}
