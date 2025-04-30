<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property Collection<Edge> $outgoingEdges
 * @property array $arguments
 * @property string $type
 */
class Node extends Model
{
    protected $table = 'automation_nodes';

    protected $guarded = [];

    protected $casts = [
        'arguments' => 'json',
    ];

    public function outgoingEdges(): HasMany
    {
        return $this->hasMany(Edge::class, 'from_node_id');
    }
}
