<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $sequence_id
 * @property int|null $from_node_id
 * @property int|null $to_node_id
 * @property array|null $conditions
 * @property array|null $metadata
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property Node $toNode
 */
class Edge extends Model
{
    protected $table = 'automation_edges';

    protected $guarded = [];

    public function toNode()
    {
        return $this->belongsTo(Node::class, 'to_node_id');
    }
}
