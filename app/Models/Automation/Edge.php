<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Model;

/**
 * @property Node $toNode
 */
class Edge extends Model
{
    protected $table = 'automation_edges';

    protected $fillable = [
        'sequence_id',
        'from_node_id', 
        'to_node_id',
    ];

    public function toNode()
    {
        return $this->belongsTo(Node::class, 'to_node_id');
    }
}
