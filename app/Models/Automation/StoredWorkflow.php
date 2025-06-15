<?php

namespace App\Models\Automation;

use App\Models\ResourceEvent;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Workflow\Models\StoredWorkflow as BaseStoredWorkflow;

/**
 * @property int|null $sequence_id
 * @property Sequence|null $sequence
 */
class StoredWorkflow extends BaseStoredWorkflow
{
    protected $table = 'workflows';
    
    protected $fillable = [
        'organization_id',
        'sequence_id',
        'class',
        'arguments',
        'output',
        'status',
    ];

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(ResourceEvent::class);
    }
}
