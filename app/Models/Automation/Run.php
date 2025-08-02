<?php

namespace App\Models\Automation;

use App\Models\ResourceEvent;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Workflow\Models\StoredWorkflow as BaseStoredWorkflow;
use Workflow\Models\StoredWorkflowException;
use Workflow\Models\StoredWorkflowLog;
use Workflow\Models\StoredWorkflowSignal;
use Workflow\Models\StoredWorkflowTimer;

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

    public function logs(): HasMany
    {
        return $this
            ->hasMany(StoredWorkflowLog::class, 'stored_workflow_id')
            ->orderBy('id');
    }

    public function signals(): HasMany
    {
        return $this
            ->hasMany(StoredWorkflowSignal::class, 'stored_workflow_id')
            ->orderBy('id');
    }

    public function timers(): HasMany
    {
        return $this
            ->hasMany(StoredWorkflowTimer::class, 'stored_workflow_id')
            ->orderBy('id');
    }

    public function exceptions(): HasMany
    {
        return $this
            ->hasMany(StoredWorkflowException::class, 'stored_workflow_id')
            ->orderBy('id');
    }
}
