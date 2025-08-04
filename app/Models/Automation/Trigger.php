<?php

namespace App\Models\Automation;

use App\Database\Traits\HasSqids;
use App\Models\App;
use App\Models\Integration;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @property Sequence $sequence
 * @property Integration $integration
 *
 * @property int $id
 * @property int $sequence_id
 * @property string|null $name
 * @property string $trigger_type
 * @property int|null $integration_id
 * @property string|null $trigger_key
 * @property array|null $configuration
 * @property array|null $test_result
 * @property array|null $conditions
 * @property string|null $webhook_url
 * @property string|null $webhook_secret
 * @property array|null $webhook_auth_config
 * @property bool $is_active
 * @property \Carbon\Carbon|null $last_triggered_at
 * @property int $trigger_count
 * @property array|null $metadata
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 *
 */
class Trigger extends Model
{
    use HasFactory,
        HasSqids;

    protected $table = 'automation_triggers';

    protected $guarded = [];

    protected $casts = [
        'configuration' => 'json',
        'test_result' => 'json',
        'conditions' => 'json',
        'webhook_auth_config' => 'json',
        'metadata' => 'json',
        'is_active' => 'boolean',
    ];

    // triggers can have bindings to models.

    // Trigger types
    const TYPE_INTEGRATION = 'integration';
    const TYPE_WEBHOOK = 'webhook';
    const TYPE_SCHEDULE = 'schedule';
    const TYPE_MANUAL = 'manual';

    public function nextNode(): BelongsTo
    {
        return $this->belongsTo(Action::class);
    }

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function app()
    {
        return $this->belongsTo(App::class);
    }

    public function triggerEvents()
    {
        return $this->hasMany(AutomationEvent::class);
    }

    /**
     * Check if this is a webhook trigger
     */
    public function isWebhookTrigger(): bool
    {
        return $this->trigger_type === self::TYPE_WEBHOOK;
    }

    /**
     * Check if this is an integration-based trigger
     */
    public function isIntegrationTrigger(): bool
    {
        return $this->trigger_type === self::TYPE_INTEGRATION;
    }

    /**
     * Check if this is a Plandalf webhook trigger
     */
    public function isPlandalfWebhookTrigger(): bool
    {
        return $this->trigger_key === 'webhook' &&
               $this->app &&
               $this->app->key === 'plandalf';
    }

    /**
     * Generate a unique webhook URL for this trigger
     */
    public function generateWebhookUrl(): string
    {
        return route('webhooks.trigger', [$this->sequence, $this]);
    }

    /**
     * Get the webhook URL attribute (generated or stored)
     */
    public function getWebhookUrlAttribute($value): ?string
    {
        if ($this->isWebhookTrigger() && !$value) {
            // Generate on-the-fly if not stored
            return $this->generateWebhookUrl();
        }

        return $value;
    }

    /**
     * Get trigger display information
     */
    public function getDisplayInfo(): array
    {
        if ($this->isWebhookTrigger()) {
            return [
                'type' => 'webhook',
                'name' => $this->name,
                'description' => 'Receives data from external webhook',
                'webhook_url' => $this->webhook_url,
                'icon' => 'webhook',
                'color' => '#6366F1',
            ];
        }

        if ($this->isIntegrationTrigger() && $this->integration) {
            return [
                'type' => 'integration',
                'name' => $this->name,
                'description' => $this->integration->app->name ?? 'Integration trigger',
                'integration' => $this->integration->name,
                'icon' => $this->integration->app->icon_url ?? 'integration',
                'color' => $this->integration->app->color ?? '#10B981',
            ];
        }

        return [
            'type' => 'unknown',
            'name' => $this->name,
            'description' => 'Unknown trigger type',
            'icon' => 'question',
            'color' => '#6B7280',
        ];
    }
}
