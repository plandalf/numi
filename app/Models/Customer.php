<?php

namespace App\Models;

use App\Models\Order\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int      $organization_id
 * @property int      $integration_id
 * @property string   $reference_id
 * @property int|null $default_payment_method_id
 * @property string   $name
 * @property string   $email
 * @property string   $currency
 * @property string   $timezone
 *
 * @property Carbon      $created_at
 * @property Carbon      $updated_at
 * @property Carbon|null $deleted_at
 */
class Customer extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'organization_id',
        'integration_id',
        'reference_id',
        'name',
        'email',
        'currency',
        'timezone',
        'default_payment_method_id',
    ];

    /**
     * Get the organization that owns the customer.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the integration that owns the customer.
     */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    /**
     * Get the checkout sessions for the customer.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the default payment method for the customer.
     */
    public function defaultPaymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'default_payment_method_id');
    }

    /**
     * Get all payment methods for the customer.
     */
    public function paymentMethods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    /**
     * Set the default payment method for this customer.
     */
    public function setDefaultPaymentMethod(PaymentMethod $paymentMethod): void
    {
        $this->update(['default_payment_method_id' => $paymentMethod->id]);
    }

    /**
     * Check if this customer has a default payment method.
     */
    public function hasDefaultPaymentMethod(): bool
    {
        return $this->default_payment_method_id !== null;
    }

    /**
     * Check if this is a new customer (has no payment methods).
     */
    public function isNewCustomer(): bool
    {
        return !$this->hasDefaultPaymentMethod() && $this->paymentMethods()->count() === 0;
    }
}
