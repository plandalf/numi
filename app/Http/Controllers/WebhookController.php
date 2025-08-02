<?php

namespace App\Http\Controllers;

use App\Models\Automation\Run;
use App\Models\Automation\Sequence;
use App\Models\Automation\Trigger;
use App\Models\Automation\AutomationEvent;
use App\Models\Organization;
use App\Workflows\RunSequenceWorkflow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Workflow\WorkflowStub;

class WebhookController extends Controller
{
    /**
     * Handle incoming webhook trigger
     */
    public function handleTrigger(Request $request, Sequence $sequence, Trigger $trigger): JsonResponse
    {
        try {
            $payload = $request->all();

            // Log the trigger event
            $triggerEvent = AutomationEvent::query()
                ->create([
                    'trigger_id' => $trigger->id,
                    'integration_id' => null, // Webhook triggers don't have integrations
                    'event_source' => AutomationEvent::SOURCE_WEBHOOK,
                    'event_data' => $payload,
                    'metadata' => [
                        'headers' => $this->getRelevantHeaders($request),
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'method' => $request->method(),
                        'url' => $request->fullUrl(),
                    ],
                    'status' => AutomationEvent::STATUS_RECEIVED,
                ]);

            // Process the webhook trigger
            $result = $this->processTrigger($trigger, $payload, $triggerEvent);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Webhook processed successfully',
                    'trigger_event_id' => $triggerEvent->id,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'trigger_event_id' => $triggerEvent->id,
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'id' => $trigger->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get relevant headers for logging
     */
    private function getRelevantHeaders(Request $request): array
    {
        $relevantHeaders = [
            'content-type',
            'content-length',
            'user-agent',
            'x-forwarded-for',
            'x-real-ip',
            'authorization',
            'x-api-key',
            'x-signature',
            'x-hub-signature',
            'x-hub-signature-256',
        ];

        $headers = [];
        foreach ($relevantHeaders as $header) {
            if ($request->hasHeader($header)) {
                $value = $request->header($header);
                // Mask sensitive headers
                if (in_array($header, ['authorization', 'x-api-key'])) {
                    $value = '***MASKED***';
                }
                $headers[$header] = $value;
            }
        }

        return $headers;
    }

    /**
     * Process the trigger and start workflow execution
     */
    private function processTrigger(Trigger $trigger, array $payload, AutomationEvent $triggerEvent): array
    {
        try {
            // Prepare trigger data
            $triggerData = [
                'trigger_source' => 'webhook',
                'trigger_id' => $trigger->id,
                'trigger_name' => $trigger->name,
                'webhook_payload' => $payload,
                'timestamp' => now()->toISOString(),
            ];

            // Check if trigger conditions are met
            if (!$this->evaluateTriggerConditions($trigger, $payload)) {
                $triggerEvent->markAsIgnored('Trigger conditions not met');
                return [
                    'success' => true,
                    'message' => 'Webhook received but conditions not met'
                ];
            }

            $run = Run::create([
                'class' => RunSequenceWorkflow::class,
                'sequence_id' => $trigger->sequence->id,
                'organization_id' => $trigger->sequence->organization_id,
                'event_id' => $triggerEvent->id,
            ]);
            // Link the trigger event to the workflow execution
            $triggerEvent->markAsProcessed($run);

            $workflow = WorkflowStub::fromStoredWorkflow($run);

            $workflow->start($triggerData, $trigger->sequence);

            return [
                'success' => true,
                'message' => 'Workflow started successfully',
                'workflow_id' => $workflowExecution->id ?? null,
            ];

        } catch (\Exception $e) {
            $triggerEvent->markAsFailed($e->getMessage());

            Log::error('Trigger processing failed', [
                'trigger_id' => $trigger->id,
                'trigger_event_id' => $triggerEvent->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process trigger: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Evaluate trigger conditions against payload
     */
    private function evaluateTriggerConditions(Trigger $trigger, array $payload): bool
    {
        $conditions = $trigger->conditions;

        if (!$conditions || empty($conditions)) {
            return true; // No conditions means always trigger
        }

        foreach ($conditions as $field => $condition) {
            if (!$this->evaluateCondition($payload, $field, $condition)) {
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
            default:
                return true;
        }
    }
}
