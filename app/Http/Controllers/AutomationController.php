<?php

namespace App\Http\Controllers;

use App\Models\Automation\Edge;
use App\Models\Automation\Node;
use App\Models\Automation\Sequence;
use App\Models\Automation\StoredWorkflow;
use App\Models\Automation\Trigger;
use App\Models\Automation\App;
use App\Models\Automation\Connection;
use App\Models\ResourceEvent;
use App\Workflows\Automation\ActivitySchemaRegistry;
use App\Workflows\Automation\SingleActivityTestWorkflow;
use App\Workflows\RunSequenceWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Workflow\Serializers\Serializer;
use Workflow\WorkflowStub;
use Illuminate\Support\Arr;

class AutomationController extends Controller
{
    public function index()
    {
        $sequences = Sequence::query()
            ->where('organization_id', auth()->user()->currentOrganization->id)
            ->with(['triggers', 'nodes', 'edges'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('Automation/Index', [
            'sequences' => $sequences,
        ]);
    }

    public function show(Sequence $sequence)
    {
        // $this->authorize('view', $sequence);

        $sequence->load(['triggers', 'nodes.app', 'nodes.connection', 'edges']);

        // Get all active apps (built-in integrations + Plandalf activities)
        $apps = $this->getAllApps();
        
        $connections = Connection::where('organization_id', auth()->user()->currentOrganization->id)
            ->where('is_active', true)
            ->with('app')
            ->get();
            
        // Get recent workflow runs for this sequence
        $runs = StoredWorkflow::where('organization_id', auth()->user()->currentOrganization->id)
            ->where(function ($query) {
                $query->where('class', 'like', '%RunSequenceWorkflow%')
                      ->orWhere('class', 'like', '%SingleActivityTestWorkflow%');
            })
            ->latest()
            ->with(['logs', 'exceptions'])
            ->take(10)
            ->get()
            ->map(function ($workflow) {
                return [
                    'id' => $workflow->id,
                    'status' => $workflow->status,
                    'class' => class_basename($workflow->class),
                    'created_at' => $workflow->created_at->toISOString(),
                    'updated_at' => $workflow->updated_at->toISOString(),
                    'output' => $workflow->output ? Serializer::unserialize($workflow->output) : null,
                    'arguments' => $workflow->arguments ? Serializer::unserialize($workflow->arguments) : null,
                    'logs_count' => $workflow->logs->count(),
                    'exceptions_count' => $workflow->exceptions->count(),
                ];
            });

        return Inertia::render('Automation/Editor', [
            'sequence' => $sequence,
            'apps' => $apps,
            'connections' => $connections,
            'runs' => $runs,
        ]);
    }

    /**
     * Get all available apps (built-in integrations + Plandalf activities)
     */
    private function getAllApps(): array
    {
        // Get activity schemas first
        $activitySchemas = ActivitySchemaRegistry::getAllActivitySchemas();
        
        // Get built-in apps from database and merge with activities
        $builtInApps = App::active()->get()->map(function ($app) use ($activitySchemas) {
            $actions = $app->getAvailableActions();
            
            // Check if there's a matching activity for this app
            if (isset($activitySchemas[$app->key])) {
                $schema = $activitySchemas[$app->key];
                $fields = [];
                
                // Convert activity schema sections to action fields
                foreach ($schema['sections'] as $sectionName => $sectionFields) {
                    foreach ($sectionFields as $fieldName => $fieldConfig) {
                        $fields[$fieldName] = [
                            'label' => $fieldConfig['label'],
                            'type' => $this->mapFieldType($fieldConfig['type']),
                            'required' => $fieldConfig['required'] ?? false,
                            'placeholder' => $fieldConfig['description'] ?? '',
                            'options' => $fieldConfig['options'] ?? null,
                        ];
                    }
                }
                
                // Add the activity as an action for this app
                $actions[] = [
                    'key' => $app->key,
                    'name' => $schema['name'],
                    'description' => $schema['description'],
                    'fields' => $fields,
                ];
            }
            
            return [
                'id' => $app->id,
                'key' => $app->key,
                'name' => $app->name,
                'description' => $app->description,
                'icon_url' => $app->icon_url,
                'color' => $app->color,
                'auth_config' => $app->auth_config ?? ['type' => 'none'],
                'actions' => $actions,
                'triggers' => $app->getAvailableTriggers(),
            ];
        })->toArray();

        // Get remaining Plandalf activities that don't match built-in apps
        $plandalfApp = $this->getPlandalfApp($activitySchemas);

        // Combine both
        return array_merge($builtInApps, [$plandalfApp]);
    }

    /**
     * Transform ActivitySchemaRegistry activities into Plandalf app
     */
    private function getPlandalfApp(?array $activitySchemas = null): array
    {
        if ($activitySchemas === null) {
            $activitySchemas = ActivitySchemaRegistry::getAllActivitySchemas();
        }
        
        // Get built-in app keys to exclude from Plandalf app
        $builtInAppKeys = App::active()->pluck('key')->toArray();
        
        // Create a single Plandalf app containing activities that don't match built-in apps
        $actions = [];
        
        foreach ($activitySchemas as $type => $schema) {
            // Skip activities that match built-in apps
            if (in_array($type, $builtInAppKeys)) {
                continue;
            }
            
            $fields = [];
            
            // Convert activity schema sections to action fields
            foreach ($schema['sections'] as $sectionName => $sectionFields) {
                foreach ($sectionFields as $fieldName => $fieldConfig) {
                    $fields[$fieldName] = [
                        'label' => $fieldConfig['label'],
                        'type' => $this->mapFieldType($fieldConfig['type']),
                        'required' => $fieldConfig['required'] ?? false,
                        'placeholder' => $fieldConfig['description'] ?? '',
                        'options' => $fieldConfig['options'] ?? null,
                    ];
                }
            }
            
            $actions[] = [
                'key' => $type,
                'name' => $schema['name'],
                'description' => $schema['description'],
                'fields' => $fields,
            ];
        }

        return [
            'id' => 999, // Special ID for Plandalf app
            'key' => 'plandalf',
            'name' => 'Plandalf',
            'description' => 'Plandalf platform actions',
            'icon_url' => null,
            'color' => '#6366f1',
            'auth_config' => [
                'type' => 'none',
                'scopes' => [],
            ],
            'actions' => $actions,
            'triggers' => [],
        ];
    }

    /**
     * Map activity field types to frontend field types
     */
    private function mapFieldType(string $activityType): string
    {
        return match ($activityType) {
            'email' => 'email',
            'url' => 'url',
            'number' => 'number',
            'textarea' => 'textarea',
            'select' => 'select',
            'json' => 'textarea',
            'key_value' => 'textarea',
            'repeater' => 'textarea',
            default => 'text',
        };
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $sequence = Sequence::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'organization_id' => auth()->user()->currentOrganization->id,
        ]);

        return redirect()->route('automation.show', $sequence)
            ->with('success', 'Automation sequence created successfully.');
    }

    public function update(Request $request, Sequence $sequence)
    {
        // $this->authorize('update', $sequence);

        // Log the incoming request data for debugging
        \Log::info('Automation update request data:', [
            'request_all' => $request->all(),
            'sequence_id' => $sequence->id,
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'snapshot' => 'required|array',
            'nodes' => 'required|array',
            'edges' => 'required|array',
            'triggers' => 'required|array',
        ]);

        \Log::info('Validated data:', $validated);

        DB::transaction(function () use ($sequence, $validated) {
            // Update sequence metadata and snapshot
            $sequence->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'snapshot' => $validated['snapshot'],
                'version' => $sequence->version + 1,
            ]);

            // Update graph structure (nodes/edges are source of truth)
            $this->updateGraphStructure($sequence, $validated);
        });

        // Reload the sequence to get updated data
        $sequence->load(['triggers', 'nodes', 'edges']);

        return back()->with('success', 'Automation sequence updated successfully.');
    }

    private function updateGraphStructure(Sequence $sequence, array $data)
    {
        // Frontend ID to DB ID mapping
        $nodeIdMap = [];
        $triggerIdMap = [];
        
        \Log::info('Updating graph structure for sequence:', [
            'sequence_id' => $sequence->id,
            'triggers_count' => count($data['triggers']),
            'nodes_count' => count($data['nodes']),
            'edges_count' => count($data['edges']),
        ]);
        
        // Process triggers first
        foreach ($data['triggers'] as $triggerData) {
            \Log::info('Processing trigger:', $triggerData);
            
            if (isset($triggerData['id']) && $triggerData['id']) {
                // Update existing trigger
                $trigger = Trigger::find($triggerData['id']);
                if ($trigger) {
                    $trigger->update([
                        'event_name' => $triggerData['event_name'],
                    ]);
                    $triggerIdMap[$triggerData['frontend_id']] = $trigger->id;
                    \Log::info('Updated existing trigger:', ['id' => $trigger->id, 'frontend_id' => $triggerData['frontend_id']]);
                }
            } else {
                // Create new trigger
                $trigger = Trigger::create([
                    'sequence_id' => $sequence->id,
                    'event_name' => $triggerData['event_name'],
                ]);
                $triggerIdMap[$triggerData['frontend_id']] = $trigger->id;
                \Log::info('Created new trigger:', ['id' => $trigger->id, 'frontend_id' => $triggerData['frontend_id']]);
            }
        }
        
        // Process nodes second
        foreach ($data['nodes'] as $nodeData) {
            \Log::info('Processing node:', $nodeData);
            
            if (isset($nodeData['id']) && $nodeData['id']) {
                // Update existing node
                $node = Node::find($nodeData['id']);
                if ($node) {
                    $node->update([
                        'type' => $nodeData['type'],
                        'arguments' => $nodeData['arguments'],
                        'app_id' => $nodeData['app_id'],
                        'connection_id' => $nodeData['connection_id'],
                        'action_key' => $nodeData['action_key'],
                    ]);
                    $nodeIdMap[$nodeData['frontend_id']] = $node->id;
                    \Log::info('Updated existing node:', ['id' => $node->id, 'frontend_id' => $nodeData['frontend_id']]);
                }
            } else {
                // Create new node (skip drafts)
                if (!str_contains($nodeData['frontend_id'], 'draft')) {
                    $node = Node::create([
                        'sequence_id' => $sequence->id,
                        'type' => $nodeData['type'],
                        'arguments' => $nodeData['arguments'],
                        'app_id' => $nodeData['app_id'],
                        'connection_id' => $nodeData['connection_id'],
                        'action_key' => $nodeData['action_key'],
                    ]);
                    $nodeIdMap[$nodeData['frontend_id']] = $node->id;
                    \Log::info('Created new node:', ['id' => $node->id, 'frontend_id' => $nodeData['frontend_id']]);
                }
            }
        }
        
        // Update trigger connections after nodes exist
        foreach ($data['triggers'] as $triggerData) {
            if (isset($triggerData['next_node_id']) && isset($nodeIdMap[$triggerData['next_node_id']])) {
                $triggerId = $triggerIdMap[$triggerData['frontend_id']];
                if ($triggerId) {
                    Trigger::where('id', $triggerId)->update([
                        'next_node_id' => $nodeIdMap[$triggerData['next_node_id']]
                    ]);
                    \Log::info('Updated trigger connection:', [
                        'trigger_id' => $triggerId,
                        'next_node_id' => $nodeIdMap[$triggerData['next_node_id']]
                    ]);
                }
            }
        }
        
        // Delete and recreate edges (simpler than complex updates)
        $deletedEdges = $sequence->edges()->delete();
        \Log::info('Deleted existing edges:', ['count' => $deletedEdges]);
        
        foreach ($data['edges'] as $edgeData) {
            $fromNodeId = $this->resolveNodeId($edgeData['from_node_id'], $nodeIdMap, $triggerIdMap);
            $toNodeId = $this->resolveNodeId($edgeData['to_node_id'], $nodeIdMap, $triggerIdMap);
            
            \Log::info('Processing edge:', [
                'from_frontend' => $edgeData['from_node_id'],
                'to_frontend' => $edgeData['to_node_id'],
                'from_db' => $fromNodeId,
                'to_db' => $toNodeId,
            ]);
            
            if ($fromNodeId && $toNodeId) {
                Edge::create([
                    'sequence_id' => $sequence->id,
                    'from_node_id' => $fromNodeId,
                    'to_node_id' => $toNodeId,
                ]);
                \Log::info('Created edge:', ['from' => $fromNodeId, 'to' => $toNodeId]);
            } else {
                \Log::warning('Could not resolve edge nodes:', [
                    'from_frontend' => $edgeData['from_node_id'],
                    'to_frontend' => $edgeData['to_node_id'],
                    'from_resolved' => $fromNodeId,
                    'to_resolved' => $toNodeId,
                ]);
            }
        }
    }

    private function resolveNodeId(string $frontendId, array $nodeIdMap, array $triggerIdMap): ?int
    {
        // Check node map first
        if (isset($nodeIdMap[$frontendId])) {
            return $nodeIdMap[$frontendId];
        }
        
        // Check trigger map
        if (isset($triggerIdMap[$frontendId])) {
            return $triggerIdMap[$frontendId];
        }
        
        // Extract numeric ID if it's a simple format like "action-123" or "trigger-456"
        if (str_starts_with($frontendId, 'action-') || str_starts_with($frontendId, 'trigger-')) {
            $numericId = preg_replace('/^(action-|trigger-)/', '', $frontendId);
            if (is_numeric($numericId)) {
                return (int) $numericId;
            }
        }
        
        \Log::warning('Could not resolve frontend ID to database ID:', [
            'frontend_id' => $frontendId,
            'node_map_keys' => array_keys($nodeIdMap),
            'trigger_map_keys' => array_keys($triggerIdMap),
        ]);
        
        return null;
    }

    public function destroy(Sequence $sequence)
    {
        // $this->authorize('delete', $sequence);

        DB::transaction(function () use ($sequence) {
            // Delete all related records
            $sequence->edges()->delete();
            $sequence->nodes()->delete();
            $sequence->triggers()->delete();
            $sequence->delete();
        });

        return redirect()->route('automation.index')
            ->with('success', 'Automation sequence deleted successfully.');
    }

    public function duplicate(Sequence $sequence)
    {
        // $this->authorize('view', $sequence);

        $newSequence = DB::transaction(function () use ($sequence) {
            $originalNodes = $sequence->nodes;
            $originalEdges = $sequence->edges;
            $originalTriggers = $sequence->triggers;

            // Create new sequence
            $newSequence = Sequence::create([
                'name' => $sequence->name . ' (Copy)',
                'description' => $sequence->description,
                'organization_id' => $sequence->organization_id,
            ]);

            // Map old node IDs to new node IDs
            $nodeIdMap = [];

            // Duplicate nodes
            foreach ($originalNodes as $node) {
                $newNode = Node::create([
                    'sequence_id' => $newSequence->id,
                    'type' => $node->type,
                    'arguments' => $node->arguments,
                ]);
                $nodeIdMap[$node->id] = $newNode->id;
            }

            // Duplicate edges with updated node IDs
            foreach ($originalEdges as $edge) {
                Edge::create([
                    'sequence_id' => $newSequence->id,
                    'from_node_id' => $nodeIdMap[$edge->from_node_id] ?? null,
                    'to_node_id' => $nodeIdMap[$edge->to_node_id] ?? null,
                ]);
            }

            // Duplicate triggers with updated node IDs
            foreach ($originalTriggers as $trigger) {
                Trigger::create([
                    'sequence_id' => $newSequence->id,
                    'event_name' => $trigger->event_name,
                    'target_type' => $trigger->target_type,
                    'target_id' => $trigger->target_id,
                    'next_node_id' => $nodeIdMap[$trigger->next_node_id] ?? null,
                ]);
            }

            return $newSequence;
        });

        return redirect()->route('automation.show', $newSequence)
            ->with('success', 'Automation sequence duplicated successfully.');
    }

    public function test(Request $request, Sequence $sequence)
    {
        // $this->authorize('view', $sequence);

        try {
            $testData = $request->get('testData', $this->getDefaultTestData());
            $startTime = microtime(true);
            
            \Log::info('Testing full sequence with workflow:', [
                'sequence_id' => $sequence->id,
                'sequence_name' => $sequence->name,
                'test_data' => $testData,
            ]);

            // Get the first trigger
            $trigger = $sequence->triggers->first();
            if (!$trigger) {
                return response()->json([
                    'success' => false,
                    'error' => 'No trigger found for sequence',
                    'message' => 'Sequence must have at least one trigger to test'
                ], 400);
            }
            
            // Create test event with organization context
            $testEvent = ResourceEvent::createTestEvent($testData, auth()->user()->currentOrganization->id);
            
            // Create and start the workflow with sequence link
            $workflow = WorkflowStub::make(RunSequenceWorkflow::class);
            $workflow->start($trigger, $testEvent);
            
            // Link workflow to sequence after creation
            if ($workflow->id()) {
                StoredWorkflow::where('id', $workflow->id())
                    ->update(['sequence_id' => $sequence->id]);
            }
            
            // Wait for workflow completion with timeout
            $timeout = 60; // 60 seconds for full sequence
            $checkStart = time();
            
            while ($workflow->running()) {
                if (time() - $checkStart > $timeout) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sequence test timed out after 60 seconds',
                        'error' => 'Timeout',
                        'workflow_id' => $workflow->id(),
                    ], 408);
                }
                usleep(500000); // 500ms
            }
            
            // Get the workflow result
            $workflowOutput = $workflow->output();
            $endTime = microtime(true);
            $executionTime = round(($endTime - $startTime) * 1000, 2);

            // Get the stored workflow for additional details
            $storedWorkflow = StoredWorkflow::with(['logs', 'exceptions'])->find($workflow->id());
            
            return response()->json([
                'success' => true,
                'results' => $workflowOutput,
                'message' => 'Sequence test completed successfully via workflow',
                'execution_time' => $executionTime,
                'workflow_id' => $workflow->id(),
                'workflow_status' => $storedWorkflow?->status,
                'sequence_info' => [
                    'id' => $sequence->id,
                    'name' => $sequence->name,
                    'nodes_count' => $sequence->nodes->count(),
                    'triggers_count' => $sequence->triggers->count(),
                ],
                'logs' => $storedWorkflow?->logs->map(function ($log) {
                    return [
                        'class' => class_basename($log->class),
                        'result' => $log->result ? Serializer::unserialize($log->result) : null,
                        'created_at' => $log->created_at->toISOString(),
                        'now' => $log->now,
                    ];
                }) ?? [],
                'exceptions' => $storedWorkflow?->exceptions->map(function ($exception) {
                    $exceptionData = Serializer::unserialize($exception->exception);
                    return [
                        'message' => $exceptionData['message'] ?? 'Unknown error',
                        'class' => $exception->class,
                        'created_at' => $exception->created_at->toISOString(),
                    ];
                }) ?? [],
            ]);

        } catch (\Exception $e) {
            $endTime = microtime(true);
            $executionTime = round(($endTime - $startTime) * 1000, 2);
            
            \Log::error('Sequence test failed:', [
                'sequence_id' => $sequence->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Sequence test failed: ' . $e->getMessage(),
                'execution_time' => $executionTime,
                'exception_details' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            ], 500);
        }
    }

    // Old test methods removed - now using WorkflowStub for real execution

    /**
     * Get default test data for testing workflows
     */
    private function getDefaultTestData(): array
    {
        return [
            'trigger' => [
                'customer' => [
                    'id' => 123,
                    'email' => 'test@example.com',
                    'name' => 'Test Customer',
                    'stripe_id' => 'cus_test123'
                ],
                'order' => [
                    'id' => 'order_test456',
                    'amount' => 99.99,
                    'status' => 'completed'
                ],
                'timestamp' => now()->toISOString()
            ]
        ];
    }

    /**
     * Test a specific action with its configuration using WorkflowStub
     */
    public function testAction(Request $request)
    {
        $validated = $request->validate([
            'app_key' => 'required|string',
            'action_key' => 'required|string',
            'connection_id' => 'nullable|integer',
            'arguments' => 'required|array',
            'step_id' => 'required|string',
            'test_data' => 'array|nullable',
            'sequence_id' => 'required|integer|exists:automation_sequences,id',
        ]);

        try {
            $startTime = microtime(true);
            
            \Log::info('Testing individual action with workflow:', [
                'app_key' => Arr::get($validated, 'app_key'),
                'action_key' => Arr::get($validated, 'action_key'),
                'connection_id' => Arr::get($validated, 'connection_id'),
                'arguments' => Arr::get($validated, 'arguments'),
                'step_id' => Arr::get($validated, 'step_id'),
            ]);

            // Support apps that have corresponding activities
            $supportedApps = ['plandalf', 'email', 'webhook'];
            if (!in_array($validated['app_key'], $supportedApps)) {
                return response()->json([
                    'success' => false,
                    'message' => 'App not supported for testing: ' . $validated['app_key'],
                    'error' => 'Unsupported app: ' . $validated['app_key'],
                    'supported_apps' => $supportedApps
                ], 400);
            }

            // Get the activity schema for this action
            $activitySchemas = ActivitySchemaRegistry::getAllActivitySchemas();
            $actionKey = $validated['action_key'];
            
            // Map app-specific action keys to activity types
            if ($validated['app_key'] === 'email') {
                $actionKey = 'email'; // Map to the email activity type
            } elseif ($validated['app_key'] === 'webhook') {
                $actionKey = 'webhook'; // Map to the webhook activity type
            }
            
            if (!isset($activitySchemas[$actionKey])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Action not found: ' . $actionKey,
                    'error' => 'Invalid action key',
                    'available_actions' => array_keys($activitySchemas)
                ], 404);
            }

            $schema = $activitySchemas[$actionKey];
            
            // Prepare node data for the workflow (only include fillable fields)
            $nodeData = [
                'type' => $actionKey,
                'arguments' => $validated['arguments'],
                'app_id' => null,
                'connection_id' => Arr::get($validated, 'connection_id'),
                'action_key' => $actionKey,
            ];
            
            // Get test data (use provided or default)
            $testData = $validated['test_data'] ?? $this->getDefaultTestData();
            
            // Pass organization ID for workflow context
            $organizationId = auth()->user()->currentOrganization->id;
            $sequenceId = $validated['sequence_id'];
            
            // Create and start the test workflow
            $workflow = WorkflowStub::make(SingleActivityTestWorkflow::class);
            $workflow->start($actionKey, $nodeData, $testData, $organizationId);
            
            // Link the workflow to the sequence after creation
            $workflowId = $workflow->id();
            if ($workflowId) {
                \Log::info('Linking test workflow to sequence', [
                    'workflow_id' => $workflowId,
                    'sequence_id' => $sequenceId,
                ]);
                
                StoredWorkflow::where('id', $workflowId)
                    ->update(['sequence_id' => $sequenceId]);
            } else {
                \Log::warning('Could not get workflow ID to link to sequence', [
                    'sequence_id' => $sequenceId,
                    'action_key' => $actionKey,
                ]);
            }
            
            // Wait for workflow completion with timeout
            $timeout = 30; // 30 seconds
            $checkStart = time();
            
            while ($workflow->running()) {
                if (time() - $checkStart > $timeout) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Action test timed out after 30 seconds',
                        'error' => 'Timeout',
                        'workflow_id' => $workflow->id(),
                    ], 408);
                }
                usleep(100000); // 100ms
            }
            
            // Get the workflow result
            $workflowOutput = $workflow->output();
            $endTime = microtime(true);
            $executionTime = round(($endTime - $startTime) * 1000, 2);

            // Get the stored workflow for additional details
            $storedWorkflow = StoredWorkflow::with(['logs', 'exceptions'])->find($workflow->id());
            
            return response()->json([
                'success' => true,
                'message' => 'Action executed successfully via workflow',
                'data' => $workflowOutput,
                'execution_time' => $executionTime,
                'workflow_id' => $workflow->id(),
                'workflow_status' => $storedWorkflow?->status,
                'action_info' => [
                    'name' => $schema['name'],
                    'description' => $schema['description'],
                    'type' => $actionKey,
                ],
                'logs' => $storedWorkflow?->logs->map(function ($log) {
                    return [
                        'class' => class_basename($log->class),
                        'result' => $log->result ? Serializer::unserialize($log->result) : null,
                        'created_at' => $log->created_at->toISOString(),
                    ];
                }) ?? [],
                'exceptions' => $storedWorkflow?->exceptions->map(function ($exception) {
                    $exceptionData = Serializer::unserialize($exception->exception);
                    return [
                        'message' => $exceptionData['message'] ?? 'Unknown error',
                        'class' => $exception->class,
                        'created_at' => $exception->created_at->toISOString(),
                    ];
                }) ?? [],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            $endTime = microtime(true);
            $executionTime = round(($endTime - $startTime) * 1000, 2);
            
            \Log::warning('Action test validation failed:', [
                'errors' => $e->errors(),
                'action_key' => $validated['action_key'],
                'arguments' => $validated['arguments'],
                'full_trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'error' => 'Please check the required fields',
                'errors' => $e->errors(),
                'execution_time' => $executionTime,
            ], 422);
        } catch (\Illuminate\Database\Eloquent\MassAssignmentException $e) {
            $endTime = microtime(true);
            $executionTime = round(($endTime - $startTime) * 1000, 2);
            
            \Log::error('MASS ASSIGNMENT ERROR in action test:', [
                'error' => $e->getMessage(),
                'full_trace' => $e->getTraceAsString(),
                'action_key' => $validated['action_key'],
                'arguments' => $validated['arguments'],
                'node_data' => $nodeData ?? 'not_set',
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $response = [
                'success' => false,
                'message' => 'Mass assignment error during test: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'execution_time' => $executionTime,
            ];

            // Always add detailed error information for mass assignment errors
            $response['exception_details'] = [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'class' => get_class($e),
                'node_data' => $nodeData ?? 'not_set',
            ];

            return response()->json($response, 500);
        } catch (\Exception $e) {
            $endTime = microtime(true);
            $executionTime = round(($endTime - $startTime) * 1000, 2);
            
            \Log::error('Action test failed:', [
                'error' => $e->getMessage(),
                'full_trace' => $e->getTraceAsString(),
                'action_key' => $validated['action_key'],
                'arguments' => $validated['arguments'],
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'class' => get_class($e),
            ]);

            $response = [
                'success' => false,
                'message' => 'Action test failed: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'execution_time' => $executionTime,
            ];

            // Add detailed error information in non-production environments
            if (!app()->environment('production')) {
                $response['exception_details'] = [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                    'class' => get_class($e),
                ];
            }

            return response()->json($response, 500);
        }
    }

    /**
     * Get workflow status and details
     */
    public function workflowStatus(Request $request)
    {
        $validated = $request->validate([
            'workflow_id' => 'required|integer|exists:workflows,id',
        ]);

        try {
            $workflow = StoredWorkflow::with(['logs', 'exceptions'])
                ->where('organization_id', auth()->user()->currentOrganization->id)
                ->find($validated['workflow_id']);

            if (!$workflow) {
                return response()->json([
                    'error' => 'Workflow not found or access denied'
                ], 404);
            }

            return response()->json([
                'id' => $workflow->id,
                'class' => class_basename($workflow->class),
                'status' => $workflow->status,
                'created_at' => $workflow->created_at->toISOString(),
                'updated_at' => $workflow->updated_at->toISOString(),
                'arguments' => $workflow->arguments ? Serializer::unserialize($workflow->arguments) : null,
                'output' => $workflow->output ? Serializer::unserialize($workflow->output) : null,
                'logs' => $workflow->logs->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'class' => class_basename($log->class),
                        'result' => $log->result ? Serializer::unserialize($log->result) : null,
                        'created_at' => $log->created_at->toISOString(),
                        'now' => $log->now,
                        'index' => $log->index,
                    ];
                }),
                'exceptions' => $workflow->exceptions->map(function ($exception) {
                    $exceptionData = Serializer::unserialize($exception->exception);
                    return [
                        'id' => $exception->id,
                        'message' => $exceptionData['message'] ?? 'Unknown error',
                        'class' => $exception->class,
                        'created_at' => $exception->created_at->toISOString(),
                        'exception_data' => $exceptionData,
                    ];
                }),
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to get workflow status:', [
                'workflow_id' => $validated['workflow_id'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to get workflow status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a draft node immediately when user adds an action
     */
    public function createDraftNode(Request $request, Sequence $sequence)
    {
        // $this->authorize('update', $sequence);

        $validated = $request->validate([
            'type' => 'required|string|in:action',
            'position_after' => 'nullable|integer', // Index to insert after (0-based)
        ]);

        \Log::info('Creating draft node:', [
            'sequence_id' => $sequence->id,
            'type' => $validated['type'],
            'position_after' => $validated['position_after'] ?? null,
        ]);

        // Create a draft node with minimal data
        $node = Node::create([
            'sequence_id' => $sequence->id,
            'type' => 'draft_action', // Special type for draft
            'arguments' => [
                'is_draft' => true,
                'created_at' => now()->toISOString(),
            ],
            'app_id' => null,
            'connection_id' => null,
            'action_key' => null,
        ]);

        \Log::info('Created draft node:', [
            'node_id' => $node->id,
            'sequence_id' => $sequence->id,
        ]);

        return response()->json([
            'success' => true,
            'node' => [
                'id' => $node->id,
                'sequence_id' => $node->sequence_id,
                'type' => $node->type,
                'arguments' => $node->arguments,
                'app_id' => $node->app_id,
                'connection_id' => $node->connection_id,
                'action_key' => $node->action_key,
                'created_at' => $node->created_at->toISOString(),
            ],
            'message' => 'Draft node created successfully',
        ]);
    }

    /**
     * Update a draft node with configuration
     */
    public function updateDraftNode(Request $request, Sequence $sequence, Node $node)
    {
        // $this->authorize('update', $sequence);

        if ($node->sequence_id !== $sequence->id) {
            return response()->json([
                'success' => false,
                'error' => 'Node does not belong to this sequence'
            ], 400);
        }

        $validated = $request->validate([
            'type' => 'sometimes|string',
            'arguments' => 'sometimes|array',
            'app_id' => 'sometimes|nullable|integer',
            'connection_id' => 'sometimes|nullable|integer',
            'action_key' => 'sometimes|nullable|string',
        ]);

        \Log::info('Updating draft node:', [
            'node_id' => $node->id,
            'updates' => $validated,
        ]);

        // Update the node
        $node->update($validated);

        return response()->json([
            'success' => true,
            'node' => [
                'id' => $node->id,
                'sequence_id' => $node->sequence_id,
                'type' => $node->type,
                'arguments' => $node->arguments,
                'app_id' => $node->app_id,
                'connection_id' => $node->connection_id,
                'action_key' => $node->action_key,
                'updated_at' => $node->updated_at->toISOString(),
            ],
            'message' => 'Node updated successfully',
        ]);
    }

    /**
     * Get workflow runs for a specific sequence
     */
    public function getWorkflowRuns(Request $request, Sequence $sequence)
    {
        // $this->authorize('view', $sequence);

        $organizationId = auth()->user()->currentOrganization->id;
        
        // Get workflow runs directly related to this sequence
        $workflowRuns = $sequence->workflows()
            ->where('organization_id', $organizationId)
            ->with(['logs', 'exceptions'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($workflow) {
                $arguments = $workflow->arguments ? Serializer::unserialize($workflow->arguments) : [];
                $output = $workflow->output ? Serializer::unserialize($workflow->output) : null;
                
                // Calculate duration if workflow is completed
                $duration = null;
                if ($workflow->status === 'completed' && $workflow->created_at && $workflow->updated_at) {
                    $duration = $workflow->created_at->diffInMilliseconds($workflow->updated_at);
                }
                
                // Determine if this is a test run
                $isTest = str_contains($workflow->class, 'SingleActivityTestWorkflow') ||
                         (isset($arguments['is_test']) && $arguments['is_test']) ||
                         (isset($output['is_test']) && $output['is_test']);
                
                // Process activities (workflow logs represent individual activities)
                $activities = $workflow->logs->map(function ($log, $index) {
                    $result = $log->result ? Serializer::unserialize($log->result) : null;
                    $activityName = class_basename($log->class);
                    
                    // Extract activity data
                    $activityData = [
                        'id' => $log->id,
                        'name' => $activityName,
                        'status' => 'completed', // If log exists, activity completed
                        'input' => [], // Input would be in arguments, but we don't have that detail in logs
                        'output' => $result,
                        'error' => null,
                        'started_at' => $log->created_at?->toISOString(),
                        'completed_at' => $log->created_at?->toISOString(),
                        'duration' => null, // Individual activity duration not tracked
                    ];
                    
                    return $activityData;
                })->toArray();
                
                // Check for workflow-level errors
                $workflowError = null;
                if ($workflow->exceptions->isNotEmpty()) {
                    $exception = $workflow->exceptions->first();
                    $exceptionData = Serializer::unserialize($exception->exception);
                    $workflowError = $exceptionData['message'] ?? 'Unknown error occurred';
                    
                    // Mark activities as failed if there are exceptions
                    foreach ($activities as &$activity) {
                        if ($activity['status'] === 'completed') {
                            $activity['status'] = 'failed';
                            $activity['error'] = $workflowError;
                        }
                    }
                }
                
                return [
                    'id' => $workflow->id,
                    'status' => $workflow->status,
                    'started_at' => $workflow->created_at->toISOString(),
                    'completed_at' => $workflow->updated_at->toISOString(),
                    'duration' => $duration,
                    'input' => $arguments,
                    'output' => $output,
                    'error' => $workflowError,
                    'is_test' => $isTest,
                    'activities' => $activities,
                ];
            });

        return response()->json([
            'success' => true,
            'runs' => $workflowRuns,
            'meta' => [
                'sequence_id' => $sequence->id,
                'sequence_name' => $sequence->name,
                'total_runs' => $workflowRuns->count(),
                'organization_id' => $organizationId,
            ],
        ]);
    }
} 