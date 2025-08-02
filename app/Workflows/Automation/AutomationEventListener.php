<?php

namespace App\Workflows\Automation;

use App\Apps\Plandalf\Triggers\OrderCreated;
use App\Models\Automation\Run;
use App\Models\Automation\Trigger;
use App\Models\Automation\AutomationEvent;
use App\Workflows\Automation\Events\AutomationTriggerEvent;
use App\Workflows\Automation\Events\SystemEvent;
use App\Workflows\RunSequenceWorkflow;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Workflow\Workflow;
use Workflow\WorkflowStub;

class AutomationEventListener
{
    public function __construct(
        private \App\Services\AppDiscoveryService $appDiscoveryService,
    )
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

        $bundle = new Bundle($event->props);

        $processedData = $e($bundle);

        // trigger event ?
        // data = the processed data!

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
            dd($e);
        }

        try {
            $run = Run::create([
                'class' => RunSequenceWorkflow::class,
                'sequence_id' => $trigger->sequence->id,
                'event_id' => $triggerEvent->id,
            ]);

            // Link the trigger event to the workflow execution
            $triggerEvent->markAsProcessed($run);

            $workflow = WorkflowStub::fromStoredWorkflow($run);

            $workflow->start($trigger, $triggerEvent);

            // Update trigger stats
//            $trigger->increment('trigger_count');
//            $trigger->update(['last_triggered_at' => now()]);
//
//            Log::info('Trigger executed successfully', [
//                'trigger_id' => $trigger->id,
//                'trigger_name' => $trigger->name,
//                'workflow_id' => $run->id,
//                'trigger_event_id' => $triggerEvent->id
//            ]);

            return;

        } catch (\Exception $e) {
            $triggerEvent->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Execute the trigger class to get processed event data
     */
    private function executeTriggerClass(Trigger $trigger, array $eventProps): array
    {
        // Find the trigger class from app discovery
        $apps = $this->appDiscoveryService->discoverApps();
        $triggerClass = null;

        foreach ($apps as $appData) {
            foreach ($appData['triggers'] as $triggerData) {
                if ($triggerData['key'] === $trigger->trigger_key) {
                    $triggerClass = $triggerData['class'];
                    break 2;
                }
            }
        }

        if (!$triggerClass || !class_exists($triggerClass)) {
            throw new \Exception("Trigger class not found for key: {$trigger->trigger_key}");
        }

        // Create trigger instance with integration and configuration
        $integration = $trigger->integration;
        $configuration = $trigger->configuration ?? [];

        $triggerInstance = new $triggerClass($integration, $configuration);

        // Create bundle with event data
        $bundle = new \App\Workflows\Automation\Bundle([
            'input' => $eventProps,
            'configuration' => $configuration
        ]);

        // Execute the trigger
        return $triggerInstance->__invoke($bundle);
    }

    /**
     * Evaluate trigger conditions against event data
     */
    private function evaluateTriggerConditions(Trigger $trigger, array $eventData): bool
    {
        $conditions = $trigger->conditions;

        if (!$conditions || empty($conditions)) {
            return true; // No conditions means always trigger
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
