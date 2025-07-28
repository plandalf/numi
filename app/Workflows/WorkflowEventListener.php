<?php

namespace App\Workflows;

use Workflow\Events\ActivityCompleted;
use Workflow\Events\ActivityFailed;
use Workflow\Events\ActivityStarted;
use Workflow\Events\WorkflowCompleted;
use Workflow\Events\WorkflowFailed;
use Workflow\Events\WorkflowStarted;

class WorkflowEventListener
{
    public function activityStarted(ActivityStarted $event)
    {

    }

    public function activityCompleted(ActivityCompleted $event)
    {
        // Handle activity completion logic here
    }

    public function activityFailed(ActivityFailed $event)
    {
        // Handle activity failure logic here
    }

    public function workflowStarted(WorkflowStarted $event)
    {

    }

    public function workflowCompleted(WorkflowCompleted $event)
    {

    }

    public function workflowFailed(WorkflowFailed $event)
    {}

}

