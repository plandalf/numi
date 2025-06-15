<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Collection<Edge> $outgoingEdges
 * @property array $arguments
 * @property string $type
 */
class Node extends Model
{
    protected $table = 'automation_nodes';

    protected $fillable = [
        'sequence_id',
        'type',
        'arguments',
        'position_x',
        'position_y',
        'app_id',
        'connection_id',
        'action_key',
    ];

    protected $casts = [
        'arguments' => 'json',
        'position_x' => 'decimal:2',
        'position_y' => 'decimal:2',
    ];

    public function outgoingEdges(): HasMany
    {
        return $this->hasMany(Edge::class, 'from_node_id');
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(App::class);
    }

    public function connection(): BelongsTo
    {
        return $this->belongsTo(Connection::class);
    }

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }
}
