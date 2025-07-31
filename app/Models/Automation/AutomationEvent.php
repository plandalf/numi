<?php

namespace App\Models\Automation;

use App\Models\Integration;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $trigger_id
 * @property int|null $integration_id
 * @property string $event_source
 * @property array $event_data
 * @property array|null $metadata
 * @property \Carbon\Carbon|null $processed_at
 * @property string $status
 * @property string|null $error_message
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class AutomationEvent extends Model
{
    protected $table = 'automation_events';

    protected $guarded = [];

    protected $casts = [
        'event_data' => 'json',
        'event_raw' => 'json',
        'metadata' => 'json',
        'processed_at' => 'datetime',
    ];

    // Event source constants
    const SOURCE_WEBHOOK = 'webhook';
    const SOURCE_API = 'api';
    const SOURCE_SCHEDULE = 'schedule';
    const SOURCE_MANUAL = 'manual';
    const SOURCE_DATABASE = 'database';
    const SOURCE_FILE = 'file';
    const SOURCE_EMAIL = 'email';

    // Status constants
    const STATUS_RECEIVED = 'received';
    const STATUS_PROCESSED = 'processed';
    const STATUS_FAILED = 'failed';
    const STATUS_IGNORED = 'ignored';

    // Relationships
    public function trigger(): BelongsTo
    {
        return $this->belongsTo(Trigger::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    // Helper methods
    public function shouldProcess(): bool
    {
        return $this->status === self::STATUS_RECEIVED;
    }

    public function markAsProcessed($execution = null): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSED,
            'processed_at' => now(),
        ]);
    }

    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'processed_at' => now(),
        ]);
    }

    public function markAsIgnored(string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_IGNORED,
            'error_message' => $reason,
            'processed_at' => now(),
        ]);
    }

    /**
     * Get formatted event data for display
     */
    public function getFormattedEventData(): array
    {
        return [
            'source' => $this->event_source,
            'trigger_name' => $this->trigger->name ?? 'Unknown',
            'status' => $this->status,
            'received_at' => $this->created_at?->toISOString(),
            'processed_at' => $this->processed_at?->toISOString(),
            'data_size' => is_array($this->event_data) ? count($this->event_data) : 0,
            'metadata' => $this->metadata,
        ];
    }

    /**
     * Scope for recent events
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope for specific trigger
     */
    public function scopeForTrigger($query, int $triggerId)
    {
        return $query->where('trigger_id', $triggerId);
    }

    /**
     * Scope for specific status
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
