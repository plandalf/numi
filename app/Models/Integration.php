<?php

namespace App\Models;

use App\Enums\IntegrationType;
use App\Modules\Integrations\AbstractIntegration;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Arr;

/**
 * @property string $lookup_key
 * @property string $type
 * @property string $organization_id
 * @property string $name
 * @property string $secret
 * @property array $config
 * @property string $current_state
 */
class Integration extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'lookup_key',
        'type',
        'organization_id',
        'name',
        'secret',
        'config',
        'current_state',
        'environment',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'config' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'type' => IntegrationType::class,
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'current_state' => 'created',
    ];

    /**
     * Get the organization that owns the integration.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function integrationClient(): AbstractIntegration
    {
        return get_integration_client_class($this);
    }

    public function getPublishableKeyAttribute()
    {
        return Arr::get($this->config, 'access_token.stripe_publishable_key');
    }

    /**
     * Get the enabled payment methods for this integration
     */
    public function getEnabledPaymentMethods(): array
    {
        return Arr::get($this->config, 'payment_methods', $this->getDefaultPaymentMethods());
    }

    /**
     * Set the enabled payment methods for this integration
     */
    public function setEnabledPaymentMethods(array $paymentMethods): void
    {
        $config = $this->config ?? [];
        $config['payment_methods'] = $paymentMethods;
        $this->update(['config' => $config]);
    }

    /**
     * Get the default payment methods for new integrations
     */
    public function getDefaultPaymentMethods(): array
    {
        return [
            'card',
            'apple_pay',
            'google_pay',
        ];
    }

    /**
     * Get all available payment methods for this integration type (SetupIntent compatible)
     */
    public function getAvailablePaymentMethods(?string $currency = null): array
    {
        // For Stripe integrations, fetch real payment methods from the API
        if ($this->type === IntegrationType::STRIPE || $this->type === IntegrationType::STRIPE_TEST) {
            try {
                $stripeClient = $this->integrationClient();
                if (method_exists($stripeClient, 'getAvailablePaymentMethods')) {
                    return $stripeClient->getAvailablePaymentMethods($currency);
                }
            } catch (\Exception $e) {
                // Log error and fall back to default methods
                logger()->error('Failed to fetch payment methods from Stripe integration client', [
                    'error' => $e->getMessage(),
                    'integration_id' => $this->id
                ]);
            }

            // Fallback to basic payment methods if API call fails
            return [
                'card' => 'Credit/Debit Cards',
                'apple_pay' => 'Apple Pay',
                'google_pay' => 'Google Pay',
            ];
        }

        return [];
    }

    /**
     * Get payment methods that only support immediate payments (PaymentIntent only)
     */
    public function getPaymentOnlyMethods(?string $currency = null): array
    {
        // For Stripe integrations, fetch payment-only methods from the API
        if ($this->type === IntegrationType::STRIPE || $this->type === IntegrationType::STRIPE_TEST) {
            try {
                $stripeClient = $this->integrationClient();
                if (method_exists($stripeClient, 'getPaymentOnlyMethods')) {
                    return $stripeClient->getPaymentOnlyMethods($currency);
                }
            } catch (\Exception $e) {
                // Log error and return empty array
                logger()->error('Failed to fetch payment-only methods from Stripe integration client', [
                    'error' => $e->getMessage(),
                    'integration_id' => $this->id
                ]);
            }
        }

        return [];
    }

    /**
     * Get all payment methods (both SetupIntent and PaymentIntent only)
     */
    public function getAllPaymentMethods(?string $currency): array
    {
        return array_merge(
            $this->getAvailablePaymentMethods($currency),
            $this->getPaymentOnlyMethods($currency)
        );
    }

    /**
     * Check if a specific payment method is enabled
     */
    public function isPaymentMethodEnabled(string $paymentMethod): bool
    {
        return in_array($paymentMethod, $this->getEnabledPaymentMethods());
    }
}
