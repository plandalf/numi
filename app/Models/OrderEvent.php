<?php

namespace App\Models;

use App\Models\Order\Order;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'organization_id',
        'user_id',
        'type',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Get the order that owns the event.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the organization that owns the event.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the user who triggered the event.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a new order event.
     */
    public static function createEvent(Order $order, string $type, string $description, array $metadata = [], User $user = null): self
    {
        return self::create([
            'order_id' => $order->id,
            'organization_id' => $order->organization_id,
            'user_id' => $user?->id,
            'type' => $type,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }
}
