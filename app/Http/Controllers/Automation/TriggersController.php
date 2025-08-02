<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Models\Automation\Sequence;
use App\Models\Automation\Action;
use App\Models\Automation\Trigger;
use App\Models\Automation\AutomationEvent;
use App\Models\App;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TriggersController extends Controller
{
    /**
     * Store a newly created trigger.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
//            'sequence_id' => 'required|integer|exists:automation_sequences,id',
            'sequence_id' => [
                'required',
                'integer',
                Rule::exists(Sequence::class, 'id')
                    ->where(function ($query) {
                        $query->where('organization_id', auth()->user()->currentOrganization->id);
                    })
            ],
            'app_id' => [
                'required',
                'integer',
                Rule::exists(App::class, 'id'),
            ],
            'trigger_id' => 'required|string',
            'name' => 'required|string|max:255',
            'configuration' => 'nullable|array',
        ]);

        try {
            $sequence = Sequence::findOrFail($validated['sequence_id']);
            $app = App::findOrFail($validated['app_id']);

            $trigger = Trigger::create([
                'sequence_id' => $sequence->id,
                'name' => $validated['name'],
                'app_id' => $app->id,
                'trigger_key' => $validated['trigger_id'],
                'configuration' => $validated['configuration'] ?? [],
            ]);

            // Load the app relationship for webhook URL generation
            $trigger->load('app');

            $triggerData = $trigger->toArray();
            
            // Add webhook URL for Plandalf webhook triggers
            if ($trigger->isPlandalfWebhookTrigger()) {
                $triggerData['webhook_url'] = $trigger->generateWebhookUrl();
            }

            return response()->json([
                'data' => $triggerData,
                'message' => 'Trigger created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create trigger: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified trigger.
     */
    public function show(int $id): Response
    {
        // TODO: Implement trigger show
        return response()->noContent();
    }

    /**
     * Update the specified trigger.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'configuration' => 'nullable|array',
        ]);

        try {
            $trigger = Trigger::findOrFail($id);
            $trigger->update([
                'name' => $validated['name'],
                'configuration' => $validated['configuration'] ?? [],
            ]);

            // Load the app relationship for webhook URL generation
            $trigger->load('app');

            $triggerData = $trigger->toArray();
            
            // Add webhook URL for Plandalf webhook triggers
            if ($trigger->isPlandalfWebhookTrigger()) {
                $triggerData['webhook_url'] = $trigger->generateWebhookUrl();
            }

            return response()->json([
                'data' => $triggerData,
                'message' => 'Trigger updated successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update trigger: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test a trigger by finding the most recent trigger event
     */
    public function test(int $triggerId): JsonResponse
    {
        try {
            // Find the trigger with its sequence and app
            $trigger = Trigger::with(['sequence', 'app'])->findOrFail($triggerId);

            // Find the most recent trigger event for this trigger
            $latestEvent = AutomationEvent::where('trigger_id', $triggerId)
                ->orderBy('created_at', 'desc')
                ->first();

            $eventData = null;
            $isExample = false;
            $eventMetadata = null;

            if ($latestEvent) {
                // Use real trigger event data
                $eventData = $latestEvent->event_data ?? [];
                $eventMetadata = [
                    'id' => $latestEvent->id,
                    'source' => $latestEvent->event_source,
                    'created_at' => $latestEvent->created_at->toISOString(),
                    'status' => $latestEvent->status
                ];
            } else {
                // No real events found - generate example data
                try {
                    // Use AppDiscoveryService to find the trigger class
                    $discoveryService = new \App\Services\AppDiscoveryService();
                    $appData = $discoveryService->getApp($trigger->app->key);

                    if ($appData) {
                        // Find the specific trigger
                        $triggerDefinition = collect($appData['triggers'])
                            ->firstWhere('key', $trigger->trigger_key);

                        if ($triggerDefinition && class_exists($triggerDefinition['class'])) {
                            // Find integration for this trigger's app
                            $integration = \App\Models\Integration::where('app_id', $trigger->app_id)
                                ->where('organization_id', auth()->user()->currentOrganization->id)
                                ->first();

                            // Create a Bundle with trigger configuration
                            $bundle = new \App\Workflows\Automation\Bundle(
                                input: $trigger->configuration ?? [],
                                integration: $integration
                            );

                            // Get example data from the trigger class
                            $triggerInstance = new $triggerDefinition['class'];
                            $eventData = $triggerInstance->example($bundle);
                            $isExample = true;

                            $eventMetadata = [
                                'type' => 'example',
                                'source' => 'Generated example data',
                                'created_at' => now()->toISOString(),
                                'status' => 'example'
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    throw ValidationException::withMessages([
                        'message' => 'Failed to generate example data: ' . $e->getMessage()
                    ]);
//                    // If example generation fails, provide basic fallback
//                    $eventData = [
//                        'example' => true,
//                        'message' => 'Example data not available for this trigger type',
//                        'error' => 'Could not generate example: ' . $e->getMessage()
//                    ];
//                    $isExample = true;
//                    $eventMetadata = [
//                        'type' => 'fallback',
//                        'source' => 'Basic fallback example',
//                        'created_at' => now()->toISOString(),
//                        'status' => 'fallback'
//                    ];
                }

                if (!$eventData) {
                    return response()->json([
                        'message' => 'No trigger events found for this trigger and could not generate example data. The trigger needs to be executed at least once before testing.'
                    ], 404);
                }
            }

            // Generate JSON Schema for the event data
            $schemaService = new \App\Services\DataSchemaService();
            $jsonSchema = $schemaService->generateJsonSchema($eventData, "Trigger {$trigger->name} Event");

            // Store test result with schema and metadata
//            $testResultData = [
//                'data' => $eventData,
//                'schema' => $jsonSchema,
//                'tested_at' => now()->toISOString(),
//                'is_example' => $isExample,
//            ];

//            if ($eventMetadata) {
//                $testResultData = array_merge($testResultData, [
//                    'event_id' => $eventMetadata['id'] ?? null,
//                    'event_source' => $eventMetadata['source'] ?? 'unknown',
//                    'event_created_at' => $eventMetadata['created_at'] ?? now()->toISOString()
//                ]);
//            }

            $trigger->update(['test_result' => $eventData]);

            // Update sequence schema with the trigger data (store as trigger instead of action)
            $currentSchema = $trigger->sequence->node_schema ?? [];
            if (!isset($currentSchema['triggers'])) {
                $currentSchema['triggers'] = [];
            }
            $currentSchema['triggers'][(string) $trigger->id] = $jsonSchema;
            $trigger->sequence->update(['node_schema' => $currentSchema]);

            return response()->json([
                'success' => true,
                'message' => $isExample
                    ? 'Trigger test completed with example data'
                    : 'Trigger test completed successfully',
                'data' => [
                    'trigger_id' => $trigger->id,
                    'trigger_name' => $trigger->name,
                    'latest_event' => $eventMetadata,
                    'result' => $eventData,
                    'timestamp' => now()->toISOString(),
                    'is_example' => $isExample,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Trigger test failed: ' . $e->getMessage(),
                'error_details' => [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            ], 422);
        }
    }

    /**
     * Get the JSON Schema for a trigger's test result
     */
    public function getSchema(int $triggerId): JsonResponse
    {
        try {
            $trigger = Trigger::findOrFail($triggerId);

            $testResult = $trigger->test_result;

            if (!$testResult || !isset($testResult['schema'])) {
                return response()->json([
                    'message' => 'No schema available. Run a test first to generate schema.'
                ], 404);
            }

            return response()->json([
                'data' => $testResult['schema'],
                'message' => 'Schema retrieved successfully',
                'tested_at' => $testResult['tested_at'] ?? null,
                'event_id' => $testResult['event_id'] ?? null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve schema: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified trigger.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $trigger = Trigger::findOrFail($id);
            $trigger->delete();

            return response()->json([
                'message' => 'Trigger deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete trigger: ' . $e->getMessage()
            ], 500);
        }
    }
}
