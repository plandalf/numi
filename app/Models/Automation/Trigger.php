<?php

namespace App\Models\Automation;

use App\Database\Traits\HasSqids;
use App\Models\Integration;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 *
 *  hooks/catch/123456/zbB61
 * // hooks/catch/{org-id}/trigger-sqid
 *
 * @property Node $nextNode
 *
 * @property int $id
 * @property int $sequence_id
 *
 * @property string $name
 * @property string $trigger_type
 * @property int $integration_id
 * @property string $trigger_key
 * @property int $configuration
 * @property int $conditions
 *
 * // todo : just use endpoint
 * @property string $webhook_url
 *
 * @property int $metadata
 * @property int $is_active
 * @property int $last_triggered_at
 * @property int $trigger_count
 * @property int $next_node_id
 * @property int $created_at
 * @property int $updated_at
 * @property Organization $organization
 */
class Trigger extends Model
{
    use HasFactory,
        HasSqids;

    protected $table = 'automation_triggers';

    protected $guarded = [];

    protected $casts = [
        'configuration' => 'json',
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
        return $this->belongsTo(Node::class);
    }

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
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
     * Generate a unique webhook URL for this trigger
     */
    public function generateWebhookUrl(): string
    {
        return route('webhooks.trigger', [$this->organization, $this]);
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
