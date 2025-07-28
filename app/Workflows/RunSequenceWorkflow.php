<?php

namespace App\Workflows;

use App\Models\Automation\Node;
use App\Models\Automation\StoredWorkflow;
use App\Models\Automation\Trigger;
use App\Models\Automation\TriggerEvent;
use App\Models\WorkflowStep;
use App\Workflows\Automation\ActivitySchemaRegistry;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\NodeActivities\ActionActivity;
use App\Workflows\Automation\TemplateResolver;
use Carbon\Carbon;
use Workflow\ActivityStub;
use Workflow\Workflow;

/**
 * @property StoredWorkflow $storedWorkflow
 * @property Carbon $now
 */
class RunSequenceWorkflow extends Workflow
{
    public function execute(
        Trigger $trigger,
        TriggerEvent $event,
    ) {
        foreach ($trigger->sequence->nodes as $node) {
            // Resolve template variables in node configuration
            $resolvedConfiguration = $this->resolveNodeConfiguration($node, $event);

            // Create input bundle with resolved configuration
            $bundle = new Bundle(
                input: $resolvedConfiguration,
                integration: $node->integration,
            );

            $startTime = $this->now;

            // Execute the action
            $output = yield ActivityStub::make(ActionActivity::class, $node, $bundle);

            // Create workflow step record
            WorkflowStep::query()->create([
                'execution_id' => $this->storedWorkflow->id,
                'node_id' => $node->id,
                'step_name' => $node->name ?? "Node {$node->id}",
                'input_data' => $resolvedConfiguration,
                'output_data' => $output,
                'status' => WorkflowStep::STATUS_COMPLETED,
                'started_at' => $startTime,
                'completed_at' => $this->now,
                'duration_ms' => $this->now->sub($startTime)->totalMilliseconds,
                'max_retries' => $node->retry_config['max_retries'] ?? 0,
                'parent_step_id' => null, // for parallel/loop actions
                'loop_iteration' => null, // for loop actions
                'loop_action_index' => null, // for loop actions
            ]);

            // Clear the workflow context cache to ensure fresh data for next steps
//            TemplateResolver::clearWorkflowContext($this->storedWorkflow->id);
        }

        return true;
    }

    /**
     * Resolve template variables in node configuration
     */
    private function resolveNodeConfiguration(Node $node, TriggerEvent $event): array
    {
        $configuration = $node->configuration ?? $node->arguments ?? [];

        // Use the enhanced template resolver for workflow context
        return TemplateResolver::resolveForWorkflow(
            $configuration,
            $this->storedWorkflow->id,
            $event
        );
    }

    protected function runNode(Node $node, $event)
    {
        // for now, will always be actionactivity until we have loops
        $activityClass = ActionActivity::class;

        if ($activityClass) {
            yield ActivityStub::make($activityClass, $node, $event);
        }

        foreach ($node->outgoingEdges as $edge) {
            if ($next = $edge->toNode) {
                yield from $this->runNode($next, $event);
            }
        }
    }
}
