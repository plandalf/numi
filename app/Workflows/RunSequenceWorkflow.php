<?php

namespace App\Workflows;

use App\Models\Automation\Action;
use App\Models\Automation\Run;
use App\Models\Automation\Trigger;
use App\Models\Automation\AutomationEvent;
use App\Models\WorkflowStep;
use App\Workflows\Automation\ActivitySchemaRegistry;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\NodeActivities\ActionActivity;
use App\Workflows\Automation\TemplateResolver;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Log;
use Workflow\ActivityStub;
use Workflow\Workflow;

/**
 * @property Run $storedWorkflow
 * @property Carbon $now
 */
class RunSequenceWorkflow extends Workflow
{
    public function execute(
        Trigger         $trigger,
        AutomationEvent $event,
    ) {
        foreach ($trigger->sequence->actions as $action) {
            // Resolve template variables in node configuration
            $resolvedConfiguration = $this->resolveNodeConfiguration($action, $event);

            // Create input bundle with resolved configuration
            $bundle = new Bundle(
                input: $resolvedConfiguration,
                integration: $action->integration,
            );

            $startTime = $this->now;

            $step = WorkflowStep::query()->firstOrCreate([
                'run_id' => $this->storedWorkflow->id,
                'action_id' => $action->id,
            ], [
                'step_name' => $action->name ?? "Node {$action->id}",
                'input_data' => $resolvedConfiguration,
                'status' => WorkflowStep::STATUS_RUNNING,
                'started_at' => $startTime,
                'max_retries' => $action->retry_config['max_retries'] ?? 0,
            ]);

            Log::info(logname(), [
                'note' => 'event: '.$event->id. ' node: '.$action->id. ' step: '.$step->id,
            ]);

            // Execute the action
            try {
                $output = yield ActivityStub::make(ActionActivity::class, $action, $bundle);
            } catch (\Exception $e) {
                Log::error(logname('workflow_error'), [
                    'workflow_id' => $this->storedWorkflow->id,
                    'node_id' => $action->id,
                    'error' => $e->getMessage(),
                ]);

                // Update step status to failed
                $step->update([
                    'status' => WorkflowStep::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                    'completed_at' => $this->now,
                    'duration_ms' => $startTime->diffInMilliseconds($this->now),
                ]);

                // note; check if we can skip?
                continue; // Skip to the next node
            }

            $step->update([
                'output_data' => $output,
                'status' => WorkflowStep::STATUS_COMPLETED,
                'completed_at' => $this->now,
                'duration_ms' => $startTime->diffInMilliseconds($this->now),
            ]);
        }

        return true;
    }

    /**
     * Resolve template variables in node configuration
     */
    private function resolveNodeConfiguration(Action $node, AutomationEvent $event): array
    {
        $configuration = $node->configuration ?? $node->arguments ?? [];

        // Use the enhanced template resolver for workflow context
        return TemplateResolver::resolveForWorkflow(
            $configuration,
            $this->storedWorkflow->id,
            $event
        );
    }

    protected function runNode(Action $node, $event)
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
