<?php

namespace App\Workflows\Automation\NodeActivities;

use App\Apps\Kajabi\Actions\CreateMember;
use App\Models\Automation\Action;
use App\Models\Automation\Trigger;
use App\Models\Integration;
use App\Models\ResourceEvent;
use App\Services\AppDiscoveryService;
use App\Workflows\Automation\Attributes\Activity;
use App\Workflows\Automation\Bundle;
use Illuminate\Support\Facades\Log;
use Workflow\Activity as WorkflowActivity;

#[Activity(
    type: 'app_action',
    name: 'App Action',
    description: 'Executes an action from a connected app',
)]
class ActionActivity extends WorkflowActivity
{
    public $tries = 3;

    public $maxExceptions = 1;

    public $timeout = 20;

    public function execute(Action $node, Bundle $bundle)
    {
        // Get discovered apps to find the action
        $discoveryService = new AppDiscoveryService();
        $data = $discoveryService->getApp($node->app->key);

        $action = collect($data['actions'])
            ->firstWhere('key', $node->action_key);

        if (!$action) {
            throw new \Exception("Action not found: {$node->action_key}");
        }

        $e = new $action['class'];

        return $e($bundle);
    }
}
