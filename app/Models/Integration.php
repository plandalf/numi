<?php

namespace App\Models;

use App\Database\Traits\UuidRouteKey;
use App\Enums\IntegrationType;
use App\Modules\Integrations\AbstractIntegration;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Arr;

/**
 * @property string $uuid
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
    use HasFactory,
        SoftDeletes,
        UuidRouteKey;

    protected $table = 'integrations';

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
        'app_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'config' => 'array',
        'connection_config' => 'json',
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
    public function getAvailablePaymentMethods(string $currency = 'usd'): array
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
    public function getPaymentOnlyMethods(string $currency = 'usd'): array
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
    public function getAllPaymentMethods(string $currency = 'usd'): array
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

    /**
     * Get the app that this integration belongs to (for automation integrations)
     */
    public function app(): BelongsTo
    {
        return $this->belongsTo(\App\Models\App::class);
    }

    /**
     * Get Kajabi client ID from config
     */
    public function getKajabiClientId(): ?string
    {
        if ($this->type !== IntegrationType::KAJABI) {
            return null;
        }

        return Arr::get($this->config, 'client_id');
    }

    /**
     * Get Kajabi client secret from config
     */
    public function getKajabiClientSecret(): ?string
    {
        if ($this->type !== IntegrationType::KAJABI) {
            return null;
        }

        return Arr::get($this->config, 'client_secret');
    }

    /**
     * Get Kajabi subdomain from config
     */
    public function getKajabiSubdomain(): ?string
    {
        if ($this->type !== IntegrationType::KAJABI) {
            return null;
        }

        return Arr::get($this->config, 'subdomain');
    }

    /**
     * Set Kajabi credentials
     */
    public function setKajabiCredentials(string $clientId, string $clientSecret, string $subdomain): void
    {
        if ($this->type !== IntegrationType::KAJABI) {
            throw new \InvalidArgumentException('This integration is not a Kajabi integration');
        }

        $config = $this->config ?? [];
        $config['client_id'] = $clientId;
        $config['client_secret'] = $clientSecret;
        $config['subdomain'] = $subdomain;

        $this->update(['config' => $config]);
    }

    /**
     * Test Kajabi connection
     */
    public function testKajabiConnection(): bool
    {
        if ($this->type !== IntegrationType::KAJABI) {
            return false;
        }

        try {
            $kajabiService = \App\Services\KajabiService::fromIntegration($this);
            $result = $kajabiService->testConnection();

            return $result['success'];
        } catch (\Exception $e) {
            logger()->error('Kajabi connection test failed', [
                'integration_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Make a Kajabi API call
     */
    public function makeKajabiApiCall(string $method, string $endpoint, array $data = []): ?array
    {
        if ($this->type !== IntegrationType::KAJABI) {
            throw new \InvalidArgumentException('This integration is not a Kajabi integration');
        }

        try {
            $kajabiService = \App\Services\KajabiService::fromIntegration($this);
            $result = $kajabiService->makeRequest($method, $endpoint, $data);

            if ($result['success']) {
                return $result['data'];
            }

            throw new \Exception($result['error'] ?? 'API request failed');
        } catch (\Exception $e) {
            logger()->error('Kajabi API call failed', [
                'integration_id' => $this->id,
                'method' => $method,
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get Kajabi site information
     */
    public function getKajabiSiteInfo(): ?array
    {
        try {
            $kajabiService = \App\Services\KajabiService::fromIntegration($this);
            $result = $kajabiService->getSiteInfo();

            return $result['success'] ? $result['data'] : null;
        } catch (\Exception $e) {
            logger()->error('Failed to get Kajabi site info', [
                'integration_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Check if this is an automation integration (has app_id)
     */
    public function isAutomationIntegration(): bool
    {
        return !is_null($this->app_id);
    }

    /**
     * Get integration display name
     */
    public function getDisplayName(): string
    {
        if ($this->isAutomationIntegration() && $this->app) {
            return $this->name ?: $this->app->name;
        }

        return $this->name ?: $this->type->label();
    }
}
