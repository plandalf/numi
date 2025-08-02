<?php

namespace App\Models\Automation;

use App\Models\ResourceEvent;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Workflow\Models\StoredWorkflow as BaseStoredWorkflow;

/**
 * @property
 */
class Run extends BaseStoredWorkflow
{
    protected $table = 'workflow_runs';

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(AutomationEvent::class, 'event_id');
    }
}
