<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Model;

/**
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
