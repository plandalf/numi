<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'payment_method_id',
        'type',
        'details',
        'is_default',
        'last_used_at',
    ];

    protected $casts = [
        'details' => 'array',
        'is_default' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the customer that owns the payment method.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the display name for the payment method.
     */
    public function getDisplayNameAttribute(): string
    {
        $details = $this->details;
        
        switch ($this->type) {
            case 'card':
                $brand = $details['brand'] ?? 'Card';
                $last4 = $details['last4'] ?? '';
                return "{$brand} ending in {$last4}";
            
            case 'bank_account':
                $bankName = $details['bank_name'] ?? 'Bank Account';
                $last4 = $details['last4'] ?? '';
                return "{$bankName} ending in {$last4}";
            
            case 'sepa_debit':
                $bankName = $details['bank_name'] ?? 'SEPA Account';
                $last4 = $details['last4'] ?? '';
                return "{$bankName} ending in {$last4}";
            
            default:
                return ucfirst(str_replace('_', ' ', $this->type));
        }
    }

    /**
     * Mark this payment method as the default for the customer.
     */
    public function markAsDefault(): void
    {
        // Remove default from other payment methods for this customer
        $this->customer->paymentMethods()
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);
        
        // Set this as default
        $this->update(['is_default' => true]);
    }

    /**
     * Update the last used timestamp.
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }
}
