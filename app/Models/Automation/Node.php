<?php

namespace App\Models\Automation;

use App\Contracts\ActionInterface;
use App\Workflows\Automation\Executors\EmailActionExecutor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $name
 * @property string $type
 * @property array $arguments
 * @property array $configuration
 * @property string|null $description
 * @property int|null $integration_id
 * @property string|null $action_key
 * @property array|null $position
 * @property array|null $metadata
 * @property array|null $retry_config
 * @property int $timeout_seconds
 * @property array|null $loop_actions
 * @property array|null $parallel_actions
 * @property int|null $parent_node_id
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Node extends Model
{
    use HasFactory;

    protected $table = 'automation_nodes';

    protected $guarded = [];

    protected $casts = [
        'arguments' => 'json',
        'configuration' => 'json',
        'position' => 'json',
        'metadata' => 'json',
        'retry_config' => 'json',
        'loop_actions' => 'json',
        'parallel_actions' => 'json',
    ];

    // type: action, loop, parallel, wait?

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Integration::class);
    }

    public function outgoingEdges(): HasMany
    {
        return $this->hasMany(Edge::class, 'from_node_id');
    }

    public function incomingEdges(): HasMany
    {
        return $this->hasMany(Edge::class, 'to_node_id');
    }

    public function parentNode(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'parent_node_id');
    }

    public function childNodes(): HasMany
    {
        return $this->hasMany(Node::class, 'parent_node_id');
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(\App\Models\App::class);
    }

    /**
     * Get the executable action for this node
     */
    public function getExecutableAction(): ActionInterface
    {
        // Use arguments for backward compatibility, fall back to configuration
        $config = $this->configuration ?? $this->arguments ?? [];

        return match($this->type) {
            'email' => new EmailActionExecutor($config),
            default => throw new \Exception("No executor available for node type: {$this->type}")
        };
    }
}
