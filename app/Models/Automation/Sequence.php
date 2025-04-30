<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * @property Collection<Node> $nodes
 * @property Collection<Edge> $edges
 * @property Trigger $trigger
 * @property string $name
 */
class Sequence extends Model
{
    protected $table = 'automation_sequences';

    protected $guarded = [];

    public function triggers()
    {
        return $this->hasMany(Trigger::class);
    }

    public function nodes()
    {
        return $this->hasMany(Node::class);
    }

    public function edges()
    {
        return $this->hasMany(Edge::class);
    }
}
