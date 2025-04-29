<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Model;

/**
 * @property Node $nextNode
 */
class Trigger extends Model
{
    protected $table = 'automation_triggers';

    protected $guarded = [];

    public function nextNode()
    {
        return $this->belongsTo(Node::class);
    }

    public function sequence()
    {
        return $this->belongsTo(Sequence::class);
    }
}
