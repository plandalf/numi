<?php

namespace App\Workflows;

use App\Models\Automation\Node;
use App\Models\Automation\StoredWorkflow;
use App\Models\Automation\Trigger;
use App\Models\ResourceEvent;
use App\Workflows\Automation\ActivitySchemaRegistry;
use Workflow\ActivityStub;
use Workflow\Workflow;

/**
 * @property StoredWorkflow $storedWorkflow
 */
class RunSequenceWorkflow extends Workflow
{
    public function execute(
        Trigger $trigger,
        ResourceEvent $event,
    ) {
        // Check if trigger has a next node to execute
        if (!$trigger->nextNode) {
            // Log that the trigger has no connected nodes
            \Log::warning('Trigger has no connected nodes', [
                'trigger_id' => $trigger->id,
                'trigger_name' => $trigger->name,
                'sequence_id' => $trigger->sequence_id
            ]);
            return true; // Return success but don't execute anything
        }

        yield from $this->runNode($trigger->nextNode, $event);

        return true;
    }

    private function runNode(Node $node, ResourceEvent $event)
    {
        $activityClass = app(ActivitySchemaRegistry::class)
            ->getActivityClassForType($node->type);

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
