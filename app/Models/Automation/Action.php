<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $name
 * @property string $type
 * @property array $arguments
 * @property array $configuration
 * @property array|null $test_result
 * @property string|null $description
 * @property int|null $integration_id
 * @property string|null $action_key
 * @property int|null $sort_order
 * @property array|null $position
 * @property array|null $metadata
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Action extends Model
{
    use HasFactory;

    protected $table = 'automation_actions';

    protected $guarded = [];

    protected $casts = [
        'arguments' => 'json',
        'configuration' => 'json',
        'test_result' => 'json',
        'sort_order' => 'integer',
        'position' => 'json',
        'metadata' => 'json',
        'retry_config' => 'json',
        'loop_actions' => 'json',
        'parallel_actions' => 'json',
    ];

    // type: action, loop, parallel, wait?

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Integration::class);
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(\App\Models\App::class);
    }
}
