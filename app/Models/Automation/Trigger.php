<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Model;

/**
 * @property Node $nextNode
 */
class Trigger extends Model
{
    protected $table = 'automation_triggers';

    protected $fillable = [
        'sequence_id',
        'event_name',
        'target_type',
        'target_id',
        'next_node_id',
        'position_x',
        'position_y',
    ];

    protected $casts = [
        'position_x' => 'decimal:2',
        'position_y' => 'decimal:2',
    ];

    public function nextNode()
    {
        return $this->belongsTo(Node::class);
    }

    public function sequence()
    {
        return $this->belongsTo(Sequence::class);
    }
}
