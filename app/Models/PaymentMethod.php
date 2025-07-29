<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Casts\BillingDetailsCast;

/**
 * @property int $id
 * @property int $customer_id
 * @property int $organization_id
 * @property int $integration_id
 * @property string $external_id
 * @property \App\ValueObjects\BillingDetails $billing_details
 * @property string $type
 * @property array $properties
 * @property array $metadata
 * @property bool $can_redisplay
 */
class PaymentMethod extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'organization_id',
        'integration_id',
        'external_id',
        'billing_details',
        'type',
        'properties',
        'metadata',
        'can_redisplay',
    ];

    protected $casts = [
        'billing_details' => BillingDetailsCast::class,
        'properties' => 'array',
        'metadata' => 'array',
        'can_redisplay' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->type === 'card' && isset($this->properties['card'])) {
            $card = $this->properties['card'];
            $brand = ucfirst($card['brand'] ?? 'Card');
            $last4 = $card['last4'] ?? '';
            return "{$brand} ending in {$last4}";
        }
        return ucfirst($this->type);
    }

    public function isCard(): bool
    {
        return $this->type === 'card';
    }

    public function getCardBrandAttribute(): ?string
    {
        return $this->properties['card']['brand'] ?? null;
    }

    public function getLast4Attribute(): ?string
    {
        return $this->properties['card']['last4'] ?? null;
    }

    public function getExpMonthAttribute(): ?int
    {
        return $this->properties['card']['exp_month'] ?? null;
    }

    public function getExpYearAttribute(): ?int
    {
        return $this->properties['card']['exp_year'] ?? null;
    }
}
