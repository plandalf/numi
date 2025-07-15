<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property Collection<Node> $nodes
 * @property Collection<Edge> $edges
 * @property Trigger $trigger
 * @property string $name
 */
class Sequence extends Model
{
    use HasFactory;
    
    protected $table = 'automation_sequences';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'is_template' => 'boolean',
        'metadata' => 'json',
        'settings' => 'json',
        'last_run_at' => 'datetime',
    ];

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
