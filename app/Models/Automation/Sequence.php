<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property Collection<Trigger> $nodes
 * @property Collection<Action> $actions
 * @property Collection<Run> $runs

 * @property string $name
 * @property string|null $description
 * @property bool $is_active
 * @property bool $is_template
 * @property array|null $metadata
 * @property array|null $settings
 * @property array|null $node_schema
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
        'node_schema' => 'json',
        'last_run_at' => 'datetime',
    ];

    public function runs(): HasMany
    {
        return $this->hasMany(Run::class, 'sequence_id');
    }

    public function triggers(): HasMany
    {
        return $this->hasMany(Trigger::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(Action::class);
    }
}
