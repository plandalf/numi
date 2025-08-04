<?php

namespace App\Workflows\Automation;

use App\Apps\Plandalf\Triggers\OrderCreated;
use App\Models\Automation\Run;
use App\Models\Automation\Trigger;
use App\Models\Automation\AutomationEvent;
use App\Services\AppDiscoveryService;
use App\Workflows\Automation\Events\AutomationTriggerEvent;
use App\Workflows\Automation\Events\SystemEvent;
use App\Workflows\RunSequenceWorkflow;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Workflow\Workflow;
use Workflow\WorkflowStub;

class AutomationEventListener
{
    public function __construct(private AppDiscoveryService $appDiscoveryService)
    {
    }

    public function __invoke(AutomationTriggerEvent $event)
    {
        [$matchingTriggers, $data] = $this->findMatchingTriggers($event);

        foreach ($matchingTriggers as $trigger) {
            try {
                $this->processTrigger($trigger, $data, $event);
            } catch (\Exception $e) {
                Log::error(logname('fail'), [
                    'trigger_id' => $trigger->id,
                    'event_type' => $event->type,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    private function findMatchingTriggers(AutomationTriggerEvent $event): array
    {
        $data = $this->appDiscoveryService->getApp($event->app);

        $matchingTriggerKeys = collect(
            data_get($data, 'triggers', [])
        )->pluck('key');

        // Find database triggers that match these trigger keys
        $triggers = Trigger::query()
            ->where('is_active', true)
            ->where('app_id', data_get($data, 'id'))
            ->whereHas('sequence', function ($query) use ($event) {
                $query
//                    ->where('is_active', true)
                    ->where('organization_id', $event->organization->id);
            })
            ->whereIn('trigger_key', $matchingTriggerKeys)
            ->with(['sequence', 'integration'])
            ->get();

        return [$triggers, $data];
    }

    private function processTrigger(Trigger $trigger, array $data, SystemEvent $event): void
    {
        // Check if trigger conditions are met
        if (!$this->evaluateTriggerConditions($trigger, $event->props)) {
            Log::info('Trigger conditions not met', [
                'trigger_id' => $trigger->id,
                'trigger_name' => $trigger->name,
                'event_type' => $event->type
            ]);
            return;
        }

        $trig = collect($data['triggers'])
            ->firstWhere('key', $event->type);

        $e = new $trig['class'];

        $bundle = new Bundle(
            organization: $event->organization,
            input: $event->props,
            configuration: $trigger->configuration,
            integration: $trigger->integration,
        );

        try {
            $processedData = $e($bundle);
        } catch (TriggerSkippedException $e) {
            return;
        }

        try {
            /* @var AutomationEvent $triggerEvent */
            // Create trigger event record with initial status
            $triggerEvent = AutomationEvent::create([
                'trigger_id' => $trigger->id,
                'integration_id' => $trigger->integration_id,
                'event_source' => AutomationEvent::SOURCE_DATABASE,
                'event_data' => $processedData,
                'event_raw' => $event->props,
                'status' => AutomationEvent::STATUS_RECEIVED,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return;
        }

        try {
            $run = Run::create([
                'class' => RunSequenceWorkflow::class,
                'sequence_id' => $trigger->sequence->id,
                'organization_id' => $trigger->sequence->organization_id,
                'event_id' => $triggerEvent->id,
            ]);

            // Link the trigger event to the workflow execution
            $triggerEvent->markAsProcessed($run);

            $workflow = WorkflowStub::fromStoredWorkflow($run);

            $workflow->start($trigger, $triggerEvent);

            return;

        } catch (\Exception $e) {
            $triggerEvent->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Evaluate trigger conditions against event data
     */
    private function evaluateTriggerConditions(Trigger $trigger, array $eventData): bool
    {
        $conditions = $trigger->conditions;

        if (!$conditions || empty($conditions)) {
            return true;
        }

        foreach ($conditions as $field => $condition) {
            if (!$this->evaluateCondition($eventData, $field, $condition)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluate a single condition
     */
    private function evaluateCondition(array $data, string $field, array $condition): bool
    {
        $value = data_get($data, $field);
        $operator = $condition['operator'] ?? 'equals';
        $expectedValue = $condition['value'] ?? null;

        switch ($operator) {
            case 'equals':
                return $value == $expectedValue;
            case 'not_equals':
                return $value != $expectedValue;
            case 'contains':
                return is_string($value) && str_contains($value, $expectedValue);
            case 'not_contains':
                return is_string($value) && !str_contains($value, $expectedValue);
            case 'greater_than':
                return is_numeric($value) && $value > $expectedValue;
            case 'less_than':
                return is_numeric($value) && $value < $expectedValue;
            case 'exists':
                return $value !== null;
            case 'not_exists':
                return $value === null;
            case 'in':
                return is_array($expectedValue) && in_array($value, $expectedValue);
            case 'not_in':
                return is_array($expectedValue) && !in_array($value, $expectedValue);
            default:
                return true;
        }
    }
}
