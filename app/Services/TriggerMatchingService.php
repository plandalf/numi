<?php

namespace App\Services;

use App\Models\Automation\Trigger;
use App\Models\Automation\AutomationEvent;
use App\Workflows\Automation\Events\SystemEvent;
use App\Workflows\RunSequenceWorkflow;
use Illuminate\Support\Facades\Log;
use Workflow\WorkflowStub;

class TriggerMatchingService
{
    public function __construct(
        private AppDiscoveryService $appDiscoveryService
    ) {}

    /**
     * Handle a system event and find matching triggers
     */
    public function handleSystemEvent(SystemEvent $event): void
    {
        Log::info('Processing system event', [
            'event_type' => $event->type,
            'event_props' => $event->props
        ]);

        // Find all triggers that match this event type
        $matchingTriggers = $this->findMatchingTriggers($event->type);

        foreach ($matchingTriggers as $trigger) {
            try {
                $this->processTrigger($trigger, $event);
            } catch (\Exception $e) {
                Log::error('Failed to process trigger', [
                    'trigger_id' => $trigger->id,
                    'event_type' => $event->type,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Find all triggers that match a given event type using reflection
     */
    private function findMatchingTriggers(string $eventType): array
    {
        // Get all discovered apps and their triggers
        $apps = $this->appDiscoveryService->discoverApps();
        $matchingTriggerKeys = [];

        // Find trigger classes that match the event type
        foreach ($apps as $appName => $appData) {
            foreach ($appData['triggers'] as $triggerData) {
                if ($triggerData['key'] === $eventType) {
                    $matchingTriggerKeys[] = [
                        'app' => $appName,
                        'trigger_key' => $triggerData['key'],
                        'trigger_class' => $triggerData['class'] ?? null
                    ];
                }
            }
        }

        // Find database triggers that match these trigger keys
        $triggers = Trigger::query()
            ->where('is_active', true)
            ->whereIn('trigger_key', array_column($matchingTriggerKeys, 'trigger_key'))
            ->with(['sequence', 'integration'])
            ->get();

        return $triggers;
    }

    /**
     * Process a single trigger against an event
     */
    private function processTrigger(Trigger $trigger, SystemEvent $event): void
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

        // Create trigger event record
        $triggerEvent = AutomationEvent::create([
            'trigger_id' => $trigger->id,
            'integration_id' => $trigger->integration_id,
            'event_source' => AutomationEvent::SOURCE_DATABASE,
            'event_data' => $event->props,
            'metadata' => [
                'event_type' => $event->type,
                'triggered_at' => now()->toISOString(),
            ],
            'status' => AutomationEvent::STATUS_RECEIVED,
        ]);

        try {
            // Execute the trigger's AppTrigger class to get processed data
            $processedData = $this->executeTriggerClass($trigger, $event->props);

            // Start workflow execution
            $workflow = WorkflowStub::make(RunSequenceWorkflow::class);
            $workflowExecution = $workflow->start($trigger, $triggerEvent);

            // Update trigger stats
            $trigger->increment('trigger_count');
            $trigger->update(['last_triggered_at' => now()]);

            // Mark trigger event as processed
            $triggerEvent->markAsProcessed($workflowExecution);

            Log::info('Trigger executed successfully', [
                'trigger_id' => $trigger->id,
                'trigger_name' => $trigger->name,
                'run_id' => $workflowExecution->id ?? null
            ]);

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
