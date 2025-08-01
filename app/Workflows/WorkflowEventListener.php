<?php

namespace App\Workflows;

use App\Models\WorkflowStep;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Log;
use Workflow\Events\ActivityCompleted;
use Workflow\Events\ActivityFailed;
use Workflow\Events\ActivityStarted;
use Workflow\Events\WorkflowCompleted;
use Workflow\Events\WorkflowFailed;
use Workflow\Events\WorkflowStarted;

class WorkflowEventListener
{
    public function subscribe(Dispatcher $events): array
    {
        return [
            ActivityStarted::class   => 'activityStarted',
            ActivityCompleted::class => 'activityCompleted',
            ActivityFailed::class    => 'activityFailed',
            WorkflowStarted::class   => 'workflowStarted',
            WorkflowCompleted::class => 'workflowCompleted',
            WorkflowFailed::class    => 'workflowFailed',
        ];
    }

    public function activityStarted(ActivityStarted $event)
    {
        Log::info(logname(), [
            'workflow_id ' => $event->workflowId,
            'args' => $event->arguments,
        ]);
    }

    public function activityCompleted(ActivityCompleted $event)
    {
        Log::info(logname(), [
            'workflow_id ' => $event->workflowId,
            'output' => $event->output,
        ]);
    }

    public function activityFailed(ActivityFailed $event)
    {
        Log::error(logname(), [
            'workflow_id ' => $event->workflowId,
            'output' => $event->output,
        ]);
    }

    public function workflowStarted(WorkflowStarted $event)
    {
        Log::info(logname(), [
            'workflow_id ' => $event->workflowId,
            'args' => $event->arguments,
        ]);

    }

    public function workflowCompleted(WorkflowCompleted $event)
    {
        Log::info(logname(), [
            'workflow_id ' => $event->workflowId,
            'output' => $event->output,
        ]);

    }

    public function workflowFailed(WorkflowFailed $event)
    {
        Log::error(logname(), [
            'workflow_id ' => $event->workflowId,
            'output' => $event->output,
        ]);
    }

}

