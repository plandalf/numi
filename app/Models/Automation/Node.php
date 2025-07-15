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

    // Node types constants
    const TYPES = [
        'email' => 'Email Action',
        'webhook' => 'Webhook Action',
        'delay' => 'Delay Action',
        'condition' => 'Condition',
        'loop' => 'Loop',
        'parallel' => 'Parallel',
        'merge' => 'Merge',
    ];

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
