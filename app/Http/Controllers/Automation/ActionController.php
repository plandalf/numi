<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Models\Automation\AutomationEvent;
use App\Models\WorkflowStep;
use App\Workflows\Automation\TemplateResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Models\Automation\Action;
use App\Models\Automation\Sequence;
use App\Models\App;
use Illuminate\Validation\Rule;

class ActionController extends Controller
{
    /**
     * Display a listing of actions for a sequence.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => [
                'required',
                'integer',
                Rule::exists(Sequence::class, 'id')
                    ->where('organization_id', auth()->user()->currentOrganization->id),
            ],
        ]);

        try {
            $sequence = Sequence::findOrFail($validated['sequence_id']);
            $actions = $sequence->actions()->where('type', 'action')->get();

            return response()->json([
                'data' => $actions,
                'message' => 'Actions retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve actions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created action.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sequence_id' => [
                'required',
                'integer',
                Rule::exists(Sequence::class, 'id')
                    ->where('organization_id', auth()->user()->currentOrganization->id),
            ],
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'app_action_key' => 'required|string',
            'app_name' => 'required|string',
            'configuration' => 'nullable|array',
        ]);

        try {
            $sequence = Sequence::findOrFail($validated['sequence_id']);

            // Find the app by name
            $app = App::where('name', $validated['app_name'])->first();
            if (!$app) {
                return response()->json([
                    'message' => 'App not found: ' . $validated['app_name']
                ], 404);
            }

            $action = Action::create([
                'sequence_id' => $sequence->id,
                'name' => $validated['name'],
                'type' => 'action',
                'app_id' => $app->id,
                'action_key' => $validated['app_action_key'],
                'configuration' => $validated['configuration'] ?? [],
                // 'position_x' => 0, // Default position
                // 'position_y' => 0, // Default position
            ]);

            return $action->load('app');
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create action: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified action.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $action = Action::where('id', $id)
                          ->where('type', 'action')
                          ->firstOrFail();

            return response()->json([
                'data' => $action->load('app'),
                'message' => 'Action retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve action: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified action.
     */
    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'app_id' => [
                'required',
                'integer',
                Rule::exists(App::class, 'id'),
            ],
            'action_key' => 'sometimes|string',
            'configuration' => 'nullable|array',

//            'sequence_id' => [
//                'required',
//                'integer',
//                Rule::exists(Sequence::class, 'id')
//                    ->where('organization_id', auth()->user()->currentOrganization->id),
//            ],
        ]);

        try {
            $action = Action::where('id', $id)
              ->where('type', 'action')
              ->firstOrFail();

            $updateData = [
                'name' => $validated['name'],
                'configuration' => $validated['configuration'] ?? [],
            ];

            // Allow updating app_id and action_key if provided
            if (isset($validated['app_id'])) {
                $updateData['app_id'] = $validated['app_id'];
            }

            if (isset($validated['action_key'])) {
                $updateData['action_key'] = $validated['action_key'];
            }

            $action->update($updateData);

            return $action->load('app');
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update action: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test an action configuration
     */
    public function test(Request $request, int $actionId): JsonResponse
    {
        $validated = $request->validate([
            'configuration' => 'nullable|array',
        ]);

        try {
            // Find the action node
            $actionNode = Action::where('id', $actionId)
                ->where('type', 'action')
                ->with(['app', 'integration', 'sequence'])
                ->firstOrFail();

            // Find integration if one exists for this app
            $integration = $actionNode->integration ?? \App\Models\Integration::query()
                ->where('app_id', $actionNode->app_id)
                ->where('organization_id', auth()->user()->currentOrganization->id)
                ->first();

            // Use AppDiscoveryService to find the action class
            $discoveryService = new \App\Services\AppDiscoveryService();
            $appData = $discoveryService->getApp($actionNode->app->key);

            if (!$appData) {
                return response()->json([
                    'message' => 'App configuration not found: ' . $actionNode->app->key
                ], 404);
            }

            // Find the specific action
            $action = collect($appData['actions'])
                ->firstWhere('key', $actionNode->action_key);

            if (!$action) {
                return response()->json([
                    'message' => 'Action not found: ' . $actionNode->action_key
                ], 404);
            }

            // Check if action class exists
            if (!class_exists($action['class'])) {
                return response()->json([
                    'message' => 'Action class not found: ' . $action['class']
                ], 500);
            }

            // Merge node configuration with request configuration (request overrides)
            $configuration = array_merge(
                $actionNode->configuration ?? [],
                $validated['configuration'] ?? []
            );

            $configuration = $actionNode->configuration;

            if ($actionNode->sequence->triggers->isEmpty()) {
                return response()->json([
                    'message' => 'No trigger found for this action. Please ensure the sequence has a trigger defined.'
                ], 422);
            }

            $r = AutomationEvent::query()
                ->where('trigger_id', $actionNode->sequence->triggers->first()->id)
                ->latest()
                ->whereNotNull('event_data')
                ->first();

            abort_if(!$r, 404, 'No recent trigger event found for this action.');

            $props = [
                'trigger' => $r->event_data,
            ];

            $actions = Action::query()
                ->where('id', '<', $actionNode->id)
                ->where('sequence_id', $actionNode->sequence_id)
                ->get();

            foreach ($actions as $step) {
                $props[implode('_', ['action', strval($step->id)])] = $step->test_result;
            }

            // Use the enhanced template resolver for workflow context
            $input = TemplateResolver::resolveValue($configuration, $props);

            // Create a Bundle with the test configuration
            $bundle = new \App\Workflows\Automation\Bundle(
                input: $input,
                integration: $integration
            );

            // Instantiate and execute the action
            $actionInstance = new $action['class'];
            $result = $actionInstance($bundle);

            // Generate JSON Schema for the result
            $schemaService = new \App\Services\DataSchemaService();
//            $jsonSchema = $schemaService->generateJsonSchema($result, "Action {$actionNode->name} Result");

            // Store test result and schema against the action node
            $actionNode->update([
                'test_result' => $result,
            ]);

            // Update sequence schema with the test result
            $schemaService->updateSequenceSchema(
                $actionNode->sequence,
                $actionNode->id,
                $result
            );

            return response()->json([
                'success' => true,
                'message' => 'Action test completed successfully',
                'data' => [
                    'action_id' => $actionNode->id,
                    'action_key' => $actionNode->action_key,
                    'app_name' => $actionNode->app->name,
                    'configuration' => $configuration,
                    'result' => $result,
                    'timestamp' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Action test failed: ' . $e->getMessage(),
                'error_details' => [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            ], 422);
        }
    }

    /**
     * Get the JSON Schema for an action's test result
     */
    public function getSchema(int $actionId): JsonResponse
    {
        try {
            $actionNode = Action::where('id', $actionId)
                              ->where('type', 'action')
                              ->firstOrFail();

            $testResult = $actionNode->test_result;

            if (!$testResult || !isset($testResult['schema'])) {
                return response()->json([
                    'message' => 'No schema available. Run a test first to generate schema.'
                ], 404);
            }

            return response()->json([
                'data' => $testResult['schema'],
                'message' => 'Schema retrieved successfully',
                'tested_at' => $testResult['tested_at'] ?? null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve schema: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available data fields from the sequence for mapping
     */
    public function getAvailableFields(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => 'required|integer|exists:automation_sequences,id',
        ]);

        try {
            $sequence = \App\Models\Automation\Sequence::findOrFail($validated['sequence_id']);
            $schemaService = new \App\Services\DataSchemaService();

            $fields = $schemaService->getAvailableFields($sequence);

            return response()->json([
                'data' => $fields,
                'message' => 'Available fields retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve available fields: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified action.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $action = Action::where('id', $id)
                          ->where('type', 'action')
                          ->firstOrFail();

            $action->delete();

            return response()->json([
                'message' => 'Action deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete action: ' . $e->getMessage()
            ], 500);
        }
    }
}
