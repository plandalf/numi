<?php

namespace App\Workflows\Automation;

use App\Models\Automation\Node;
use App\Models\ResourceEvent;
use App\Services\JavaScriptExecutionService;
use App\Workflows\Automation\Attributes\Activity;
use App\Workflows\Automation\Attributes\ActivityArgument;
use Illuminate\Support\Arr;
use Workflow\Activity as WorkflowActivity;

#[Activity(
    type: 'custom_function',
    name: 'Custom Function',
    description: 'Execute custom JavaScript code with access to secure APIs',
)]
#[ActivityArgument(
    name: 'code',
    type: 'textarea',
    label: 'JavaScript Code',
    description: 'The JavaScript code to execute. Has access to fetch, stripe, and other secure APIs.',
    section: 'code',
    required: true
)]
#[ActivityArgument(
    name: 'timeout',
    type: 'number',
    label: 'Timeout (seconds)',
    description: 'Maximum execution time in seconds',
    section: 'advanced',
    default: 30,
    required: false
)]
class CustomFunctionActivity extends WorkflowActivity
{
    public function __construct(
        private JavaScriptExecutionService $jsExecutionService
    ) {}

    public function execute(Node $node, ResourceEvent $event)
    {
        $code = TemplateResolver::get($event, Arr::get($node->arguments, 'code'));
        $timeout = TemplateResolver::get($event, Arr::get($node->arguments, 'timeout', 30));

        if (empty($code)) {
            return [
                'success' => false,
                'error' => 'No code provided',
            ];
        }

        // Prepare context for JavaScript execution
        $context = [
            'trigger' => $event->snapshot,
            'event' => [
                'id' => $event->id,
                'action' => $event->action,
                'organization_id' => $event->organization_id,
                'created_at' => $event->created_at->toISOString(),
            ],
            'environment' => app()->environment(),
        ];

        // Execute the JavaScript code
        $result = $this->jsExecutionService->execute($code, $context);

        if (!$result['success']) {
            logger()->error('Custom function execution failed', [
                'node_id' => $node->id,
                'event_id' => $event->id,
                'error' => $result['error'],
            ]);
        }

        return $result;
    }
} 