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
 * @property string|null $description
 * @property bool $is_active
 * @property bool $is_template
 * @property array|null $metadata
 * @property array|null $settings
 * @property int|null $created_by
 * @property \Carbon\Carbon|null $last_run_at
 * @property int $run_count
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
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
