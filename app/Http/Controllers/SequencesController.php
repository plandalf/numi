<?php

namespace App\Http\Controllers;

use App\Models\Automation\Sequence;
use App\Models\Automation\Run;
use App\Models\Automation\Trigger;
use App\Models\Automation\Action;
use App\Models\App;
use App\Models\Integration;
use App\Services\AppDiscoveryService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Workflow\Serializers\Serializer;
use App\Workflows\Automation\Bundle;

class SequencesController extends Controller
{
    public function index(): Response
    {
        $organizationId = Auth::user()->currentOrganization->id;

        $sequences = Sequence::query()
            ->where('organization_id', $organizationId)
            ->with(['triggers', 'actions'])
            ->latest()
            ->get();

        $workflows = Run::query()
            ->where('organization_id', $organizationId)
            ->latest()
            ->with(['logs', 'exceptions'])
            ->paginate();

        $workflows->transform(function (Run $wf) {

            return [
                'id' => $wf->id,
                'logs' => collect($wf->logs)
                    ->map(function (\Workflow\Models\StoredWorkflowLog $log) {
                        return [
                            'id' => $log->id,
                            'created_at' => $log->created_at,
                            'class' => $log->class,
                            'content' => Serializer::unserialize($log->result),
                        ];
                    })
                    ->toArray(),
                'exceptions' => collect($wf->exceptions)
                    ->map(function (\Workflow\Models\StoredWorkflowException $e) {
                        return Serializer::unserialize($e->exception);
                    })
                    ->toArray(),
                'arguments' => Serializer::unserialize($wf->arguments),
                'output' => $wf->output ? Serializer::unserialize($wf->output) : 'no-output',
            ];
        });

        return Inertia::render('sequences/Index', [
            'sequences' => $sequences,
            'workflows' => $workflows,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $organizationId = Auth::user()->currentOrganization->id;

        $sequence = Sequence::create([
            'organization_id' => $organizationId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => false, // Start as inactive
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('sequences.edit', $sequence)
            ->with('success', 'Sequence created successfully!');
    }

    public function edit(Sequence $sequence): Response|JsonResponse
    {
        // Ensure the sequence belongs to the current organization
        $this->authorize('update', $sequence);

        $sequence->load(['triggers', 'actions']);

        // Get discovered apps instead of hardcoded ones
        $discoveryService = new AppDiscoveryService();
        $discoveredApps = $discoveryService->discoverApps();

        // Transform discovered apps to match the expected format
        $apps = collect($discoveredApps)->map(function ($app, $key) {
            return [
                'id' => $key, // Use the app key as ID
                'key' => $key,
                'name' => $app['name'],
                'class' => $app['class'],
                'description' => 'Discovered app with ' . count($app['actions']) . ' actions and ' . count($app['triggers']) . ' triggers',
                'icon_url' => null, // Could be added to the discovery system later
                'color' => '#3b82f6', // Default blue color
                'category' => 'automation',
                'triggers' => $app['triggers'],
                'actions' => $app['actions'],
                'resources' => $app['resources'],
            ];
        })->values();

        $integrations = Integration::query()
            ->where('organization_id', Auth::user()->currentOrganization->id)
            ->with('app')
            ->get(['id', 'app_id', 'name', 'type']);

        if (request()->expectsJson()) {
            return response()->json([
                'sequence' => $sequence->load('triggers.integration.app',  'actions'),
                'apps' => $apps,
                'integrations' => $integrations,
            ]);
        }

        return Inertia::render('sequences/Edit', [
            'sequence' => $sequence->load([
                'triggers.app',
                'triggers.integration.app',
                'actions',
            ]),
            'apps' => $apps,
            'integrations' => $integrations,
        ]);
    }

    /**
     * Get all available apps
     */
    public function getApps(): JsonResponse
    {
        $apps = App::where('is_active', true)
            ->get(['id', 'key', 'name', 'description', 'icon_url', 'color', 'category', 'triggers', 'actions']);

        return response()->json(['apps' => $apps]);
    }

    /**
     * Get specific app with triggers and actions
     */
    public function getApp(App $app): JsonResponse
    {
        if (!$app->is_active) {
            return response()->json(['error' => 'App is not active'], 404);
        }

        return response()->json(['app' => $app]);
    }

    /**
     * Get triggers for a specific app
     */
    public function getAppTriggers(App $app): JsonResponse
    {
        if (!$app->is_active) {
            return response()->json(['error' => 'App is not active'], 404);
        }

        return response()->json(['triggers' => $app->triggers ?? []]);
    }

    /**
     * Get actions for a specific app
     */
    public function getAppActions(App $app): JsonResponse
    {
        if (!$app->is_active) {
            return response()->json(['error' => 'App is not active'], 404);
        }

        return response()->json(['actions' => $app->actions ?? []]);
    }

    /**
     * Get all discovered app actions
     */
    public function getDiscoveredActions(): JsonResponse
    {
        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();
        $actions = [];

        foreach ($apps as $appName => $app) {
            $key = strtolower($appName);
            $actions[] = array_merge($app['actions'], ['app' => $key]);
        }

        return response()->json($actions);
    }

    /**
     * Get all discovered app triggers
     */
    public function getDiscoveredTriggers()
    {
        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();
        $triggers = [];

        foreach ($apps as $appName => $app) {
            $key = strtolower($appName);

            $triggers[] = array_merge($app['triggers'], [
                'app' => $key,
            ]);
        }

        return $triggers;
    }

    /**
     * Get all discovered apps with actions, triggers, and resources
     */
    public function getDiscoveredApps(): JsonResponse
    {
        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();

        return response()->json($apps);
    }

    /**
     * Get all discovered app resources
     */
    public function getDiscoveredResources(): JsonResponse
    {
        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();
        $resources = [];

        foreach ($apps as $appName => $app) {
            $key = strtolower($appName);
            $resources[$key] = $app['resources'];
        }

        return response()->json($resources);
    }

    /**
     * Debug endpoint to see what's being discovered
     */
    public function debugDiscovery(): JsonResponse
    {
        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();
        $actions = $discoveryService->getAllActions();
        $triggers = $discoveryService->getAllTriggers();
        $resources = $discoveryService->getAllResources();

        return response()->json([
            'apps' => $apps,
            'actions' => $actions,
            'triggers' => $triggers,
            'resources' => $resources,
        ]);
    }

    /**
     * Search a specific resource
     */
    public function searchResource(Request $request, string $resource = null): JsonResponse
    {
        // Handle route parameter format: /resource-search/{resource}
        if ($resource) {
            $request->merge(['resource' => $resource]);
        }

        $request->validate([
            'app' => 'required|string',
            'resource' => 'required|string',
            'integration_id' => 'required|integer',
            'search' => 'nullable|string',
        ]);

        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();

        // Convert app name to proper case for lookup
        $appKey = ucfirst(strtolower($request->app));

        if (!isset($apps[$appKey])) {
            return response()->json(['error' => 'App not found'], 404);
        }

        $app = $apps[$appKey];
        $resourceClass = null;

        foreach ($app['resources'] as $resource) {
            if ($resource['key'] === $request->resource) {
                $resourceClass = $resource['class'];
                break;
            }
        }

        if (!$resourceClass) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        $integration = Integration::findOrFail($request->integration_id);
        $resource = new $resourceClass($integration);

        $results = $resource->search([
            'search' => $request->search,
        ]);

        return response()->json(['data' => $results]);
    }

    /**
     * Get discovered actions for a specific app
     */
    public function getDiscoveredAppActions(string $appName): JsonResponse
    {
        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();

        // Convert app name to proper case for lookup
        $appKey = ucfirst(strtolower($appName));

        if (!isset($apps[$appKey])) {
            return response()->json(['error' => 'App not found'], 404);
        }

        return response()->json(['actions' => $apps[$appKey]['actions']]);
    }

    /**
     * Get discovered triggers for a specific app
     */
    public function getDiscoveredAppTriggers(string $appName): JsonResponse
    {
        $discoveryService = new AppDiscoveryService();
        $apps = $discoveryService->discoverApps();

        // Convert app name to proper case for lookup
        $appKey = ucfirst(strtolower($appName));

        if (!isset($apps[$appKey])) {
            return response()->json(['error' => 'App not found'], 404);
        }

        return response()->json(['triggers' => $apps[$appKey]['triggers']]);
    }

    /**
     * Get integrations for current organization
     */
    public function getIntegrations(): JsonResponse
    {
        $organizationId = Auth::user()->currentOrganization->id;

        $integrations = Integration::where('organization_id', $organizationId)
            ->with('app:id,key,name,icon_url,color')
            ->get(['id', 'uuid', 'app_id', 'name', 'type', 'current_state', 'created_at']);

        return response()->json(['integrations' => $integrations]);
    }

    /**
     * Get available triggers for a specific integration
     */
    public function getIntegrationTriggers(Integration $integration): JsonResponse
    {
        $this->authorize('view', $integration);

        try {
            $integrationClass = \App\Modules\Integrations\IntegrationHandlerFactory::createIntegrationFromModel($integration);
            $triggers = $integrationClass->triggers();

            return response()->json(['triggers' => $triggers]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get triggers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available actions for a specific integration
     */
    public function getIntegrationActions(Integration $integration): JsonResponse
    {
        $this->authorize('view', $integration);

        try {
            $integrationClass = \App\Modules\Integrations\IntegrationHandlerFactory::createIntegrationFromModel($integration);
            $actions = $integrationClass->actions();

            return response()->json(['actions' => $actions]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get actions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test an action execution
     */
    public function testIntegrationAction(Integration $integration, Request $request): JsonResponse
    {
        $this->authorize('view', $integration);

        $validated = $request->validate([
            'action_key' => 'required|string',
            'input' => 'required|array',
        ]);

        try {
            // Get the app from the integration
            $app = $integration->app;
            if (!$app) {
                return response()->json([
                    'success' => false,
                    'message' => 'Integration app not found'
                ], 404);
            }

            // Get discovered apps to find the action
            $discoveryService = new AppDiscoveryService();
            $apps = $discoveryService->discoverApps();

            // Convert app name to proper case for lookup
            $appKey = ucfirst(strtolower($app->key));

            if (!isset($apps[$appKey])) {
                return response()->json([
                    'success' => false,
                    'message' => 'App not found in discovery'
                ], 404);
            }

            $appData = $apps[$appKey];

            // Find the action in the app's actions
            $action = null;
            foreach ($appData['actions'] as $appAction) {
                if ($appAction['key'] === $validated['action_key']) {
                    $action = $appAction;
                    break;
                }
            }

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => ["Unknown action: {$validated['action_key']}"]
                ], 422);
            }

            // Create the action instance
            $actionClass = $action['class'];
            $actionInstance = new $actionClass($integration);

            // Create a bundle with the input data
            $bundle = new Bundle($validated['input']);

            // Test the action
            $result = $actionInstance->__invoke($bundle);

            return response()->json([
                'success' => true,
                'result' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Action test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get credential fields for a specific integration type
     */
    public function getIntegrationCredentialFields(string $integrationType): JsonResponse
    {
        try {
            $type = \App\Enums\IntegrationType::from($integrationType);

            if (!\App\Modules\Integrations\IntegrationHandlerFactory::isSupported($type)) {
                return response()->json(['error' => 'Unsupported integration type'], 400);
            }

            $credentialFields = \App\Modules\Integrations\IntegrationHandlerFactory::getCredentialFields($type);
            $helpInfo = \App\Modules\Integrations\IntegrationHandlerFactory::getHelpInfo($type);

            return response()->json([
                'credential_fields' => $credentialFields,
                'help_info' => $helpInfo,
            ]);
        } catch (\ValueError $e) {
            return response()->json(['error' => 'Invalid integration type'], 400);
        }
    }

    /**
     * Store a new integration
     */
    public function storeIntegration(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'app_id' => 'required|exists:apps,id',
            'name' => 'required|string|max:255',
            'credentials' => 'required|array',
        ]);

        $app = App::findOrFail($validated['app_id']);

        // Determine integration type based on app
        $integrationType = match($app->key) {
            'kajabi' => \App\Enums\IntegrationType::KAJABI,
            'stripe' => \App\Enums\IntegrationType::STRIPE,
            default => throw new \InvalidArgumentException("Unsupported app type: {$app->key}"),
        };

        // Get the integration class and validate credentials
        $integrationClass = \App\Modules\Integrations\IntegrationHandlerFactory::createIntegration($integrationType);
        $errors = $integrationClass->validateCredentials($validated['credentials']);

        if (!empty($errors)) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);
        }

        // Process credentials (e.g., format subdomain for Kajabi)
        $processedCredentials = $integrationClass->processCredentials($validated['credentials']);

        // Create the integration
        $integration = Integration::create([
            'organization_id' => Auth::user()->currentOrganization->id,
            'app_id' => $validated['app_id'],
            'name' => $validated['name'],
            'type' => $integrationType,
            'config' => $processedCredentials,
            'current_state' => 'created',
            'environment' => 'live',
            'lookup_key' => 'automation_' . strtolower($app->key) . '_' . uniqid(),
        ]);

        // Test the connection immediately using the integration class
        try {
            $integrationClassWithCreds = \App\Modules\Integrations\IntegrationHandlerFactory::createIntegrationFromModel($integration);
            $testResult = $integrationClassWithCreds->testConnection($integration);

            // If test is successful, mark integration as active
            if ($testResult['success']) {
                $integration->update(['current_state' => 'active']);
            }
        } catch (\Exception $e) {
            $testResult = [
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage()
            ];
        }

        return response()->json([
            'integration' => $integration->load('app'),
            'test_result' => $testResult,
            'message' => 'Integration created successfully'
        ], 201);
    }

    /**
     * Test an integration connection
     */
    public function testIntegration(Integration $integration): JsonResponse
    {
        $this->authorize('update', $integration);

        try {
            // Get the integration class directly (implements all interfaces)
            $integrationClass = \App\Modules\Integrations\IntegrationHandlerFactory::createIntegrationFromModel($integration);
            $result = $integrationClass->testConnection($integration);

            // Update integration status based on test result
            if ($result['success']) {
                $integration->update(['current_state' => 'active']);
            } else {
                $integration->update(['current_state' => 'error']);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            $integration->update(['current_state' => 'error']);

            return response()->json([
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an integration
     */
    public function updateIntegration(Request $request, Integration $integration): JsonResponse
    {
        $this->authorize('update', $integration);

        // Get the integration class
        $integrationClass = \App\Modules\Integrations\IntegrationHandlerFactory::createIntegrationFromModel($integration);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'credentials' => 'sometimes|array',
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }

        if (isset($validated['credentials'])) {
            // Validate credentials using the integration class
            $errors = $integrationClass->validateCredentials($validated['credentials']);

            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $errors
                ], 422);
            }

            // Process credentials (e.g., format subdomain for Kajabi)
            $processedCredentials = $integrationClass->processCredentials($validated['credentials']);

            $updateData['config'] = $processedCredentials;
            $updateData['current_state'] = 'created'; // Reset to created until tested
        }

        $integration->update($updateData);

        return response()->json([
            'integration' => $integration->load('app'),
            'message' => 'Integration updated successfully'
        ]);
    }

    /**
     * Delete integration
     */
    public function destroyIntegration(Integration $integration): JsonResponse
    {
        $this->authorizeIntegration($integration);

        $integration->delete();

        return response()->json([
            'message' => 'Integration deleted successfully'
        ]);
    }

    /**
     * Show a specific trigger
     */
    public function showTrigger(Sequence $sequence, Trigger $trigger): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($trigger->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Trigger does not belong to this sequence'], 404);
        }

        return response()->json([
            'trigger' => $trigger->load('integration.app'),
        ]);
    }

    /**
     * Show a specific action
     */
    public function showAction(Sequence $sequence, Action $node): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($node->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Action does not belong to this sequence'], 404);
        }

        return response()->json([
            'action' => $node,
        ]);
    }

    /**
     * Store a new trigger for a sequence
     */
    public function storeTrigger(Request $request, Sequence $sequence): JsonResponse
    {
        $this->authorize('update', $sequence);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'app_id' => 'required|exists:apps,id',
            'integration_id' => 'required|exists:integrations,id',
            'trigger_key' => 'required|string',
            'configuration' => 'nullable|array',
            'conditions' => 'nullable|array',
            'app_name' => 'nullable|string', // For discovered triggers
        ]);

        // Verify the integration belongs to the current organization and app
        $integration = Integration::where('id', $validated['integration_id'])
            ->where('organization_id', Auth::user()->currentOrganization->id)
            ->where('app_id', $validated['app_id'])
            ->first();

        if (!$integration) {
            return response()->json(['error' => 'Invalid integration'], 400);
        }

        $triggerData = [
            'sequence_id' => $sequence->id,
            'name' => $validated['name'],
            'integration_id' => $validated['integration_id'],
            'trigger_key' => $validated['trigger_key'],
            'configuration' => $validated['configuration'] ?? [],
            'conditions' => $validated['conditions'] ?? [],
            'is_active' => true,
        ];

        // Add metadata for discovered triggers
        if (isset($validated['app_name'])) {
            $triggerData['metadata'] = [
                'app_name' => $validated['app_name'],
            ];
        }

        $trigger = Trigger::create($triggerData);

        $trigger->load('integration.app:id,key,name,icon_url,color');

        return response()->json([
            'trigger' => $trigger,
            'message' => 'Trigger created successfully'
        ], 201);
    }

    /**
     * Update trigger
     */
    public function updateTrigger(Request $request, Sequence $sequence, Trigger $trigger): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($trigger->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Trigger does not belong to this sequence'], 400);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'configuration' => 'sometimes|array',
            'conditions' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $trigger->update($validated);
        $trigger->load('integration.app:id,key,name,icon_url,color');

        return response()->json([
            'trigger' => $trigger,
            'message' => 'Trigger updated successfully'
        ]);
    }

    /**
     * Delete trigger
     */
    public function destroyTrigger(Sequence $sequence, Trigger $trigger): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($trigger->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Trigger does not belong to this sequence'], 400);
        }

        $trigger->delete();

        return response()->json([
            'message' => 'Trigger deleted successfully'
        ]);
    }

    /**
     * Store a webhook trigger (no integration required)
     */
    public function storeWebhookTrigger(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => 'required|exists:automation_sequences,id',
            'name' => 'required|string|max:255',
            'conditions' => 'nullable|array',
            'webhook_auth_config' => 'nullable|array',
        ]);

        // Verify the sequence belongs to the current organization
        $sequence = Sequence::where('id', $validated['sequence_id'])
            ->where('organization_id', Auth::user()->currentOrganization->id)
            ->first();

        if (!$sequence) {
            return response()->json(['error' => 'Invalid sequence'], 400);
        }

        $this->authorize('update', $sequence);

        $trigger = Trigger::create([
            'sequence_id' => $sequence->id,
            'name' => $validated['name'],
            'trigger_type' => Trigger::TYPE_WEBHOOK,
            'integration_id' => null, // Webhook triggers don't need integrations
            'trigger_key' => 'webhook',
            'configuration' => [],
            'conditions' => $validated['conditions'] ?? [],
            'webhook_auth_config' => $validated['webhook_auth_config'] ?? null,
            'is_active' => true,
        ]);

        $trigger->load('sequence');

        return response()->json([
            'trigger' => [
                'id' => $trigger->id,
                'name' => $trigger->name,
                'trigger_type' => $trigger->trigger_type,
                'webhook_url' => $trigger->webhook_url,
                'webhook_secret' => $trigger->webhook_secret,
                'is_active' => $trigger->is_active,
                'display_info' => $trigger->getDisplayInfo(),
            ],
            'message' => 'Webhook trigger created successfully'
        ], 201);
    }

    /**
     * Store a new action/node for a sequence
     */
    public function storeAction(Request $request, Sequence $sequence): JsonResponse
    {
        $this->authorize('update', $sequence);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:email,webhook,delay,condition,app_action',
            'configuration' => 'required|array',
            'position' => 'nullable|array',
            'app_action_key' => 'nullable|string',
            'app_name' => 'nullable|string',
        ]);

        // Create the action node
        $nodeData = [
            'sequence_id' => $sequence->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'arguments' => $validated['configuration'], // Map configuration to arguments
            'position' => $validated['position'] ?? null,
        ];

        // Add app action metadata if this is an app action
        if ($validated['type'] === 'app_action') {
            $nodeData['metadata'] = [
                'app_action_key' => $validated['app_action_key'],
                'app_name' => $validated['app_name'],
            ];
        }

        $node = Action::create($nodeData);

        return response()->json([
            'action' => $node,
            'message' => 'Action created successfully'
        ], 201);
    }

    /**
     * Update an existing action/node
     */
    public function updateAction(Request $request, Sequence $sequence, Action $node): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($node->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Action does not belong to this sequence'], 400);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'configuration' => 'sometimes|array',
            'position' => 'sometimes|array',
        ]);

        // Map configuration to arguments for backward compatibility
        if (isset($validated['configuration'])) {
            $validated['arguments'] = $validated['configuration'];
            unset($validated['configuration']);
        }

        $node->update($validated);

        return response()->json([
            'action' => $node,
            'message' => 'Action updated successfully'
        ]);
    }

    /**
     * Delete an action/node
     */
    public function destroyAction(Sequence $sequence, Action $node): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($node->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Action does not belong to this sequence'], 400);
        }

        $node->delete();

        return response()->json([
            'message' => 'Action deleted successfully'
        ]);
    }

    /**
     * Test an action configuration before creating it (without sequence)
     */
    public function testActionConfig(Request $request, Sequence $sequence = null): JsonResponse
    {
        // Only authorize if sequence is provided
        if ($sequence) {
            $this->authorize('update', $sequence);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'required|string',
                'app_action_key' => 'required|string',
                'app_name' => 'required|string',
                'configuration' => 'required|array',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            // Get the discovered action
            $discoveryService = new AppDiscoveryService();
            $apps = $discoveryService->discoverApps();

            // Convert app name to proper case for lookup
            $appKey = ucfirst(strtolower($validated['app_name']));

            if (!isset($apps[$appKey])) {
                return response()->json([
                    'success' => false,
                    'message' => 'App not found'
                ], 404);
            }

            $app = $apps[$appKey];
            $action = null;

            foreach ($app['actions'] as $appAction) {
                if ($appAction['key'] === $validated['app_action_key']) {
                    $action = $appAction;
                    break;
                }
            }

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Action not found'
                ], 404);
            }

            // Find the integration for this app and current organization
            $integration = Integration::where('organization_id', Auth::user()->currentOrganization->id)
                ->whereHas('app', function ($q) use ($validated) {
                    $q->where('key', strtolower($validated['app_name']));
                })
                ->first();
            if (!$integration) {
                return response()->json([
                    'success' => false,
                    'message' => 'Integration not found for app',
                ], 404);
            }

            // Instantiate the action class
            $actionClass = $action['class'];
            $actionInstance = new $actionClass($integration, $validated['configuration']);

            // Test the action
            $result = $actionInstance->__invoke(new Bundle($validated['configuration']));

            return response()->json([
                'success' => true,
                'message' => 'Action test completed successfully',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test failed: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test an action using its configured settings
     */
    public function testAction(Request $request, Sequence $sequence, Action $node): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($node->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Action does not belong to this sequence'], 400);
        }

        try {
            $result = $this->executeTestAction($node);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data'] ?? []
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test failed: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test a trigger by fetching real data from the integration
     */
    public function testTrigger(Request $request, Sequence $sequence, Trigger $trigger): JsonResponse
    {
        $this->authorize('update', $sequence);

        if ($trigger->sequence_id !== $sequence->id) {
            return response()->json(['error' => 'Trigger does not belong to this sequence'], 400);
        }

        try {
            $result = $this->executeTestTrigger($trigger);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data'] ?? []
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test failed: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get actions that come before the current action in the sequence
     */
    private function getPreviousActions(Sequence $sequence, Action $currentNode): array
    {
        $allNodes = $sequence->actions()->orderBy('id')->get();
        $currentIndex = $allNodes->search(function ($node) use ($currentNode) {
            return $node->id === $currentNode->id;
        });

        if ($currentIndex === false || $currentIndex === 0) {
            return [];
        }

        return $allNodes->slice(0, $currentIndex)->toArray();
    }

    /**
     * Generate mock output data for previous actions
     */
    private function generateStepData(array $previousActions): array
    {
        $stepData = [];

        foreach ($previousActions as $action) {
            $actionId = $action['id'];

            switch ($action['type']) {
                case 'email':
                    $stepData[$actionId] = [
                        'sent_at' => now()->toISOString(),
                        'recipient' => 'user@example.com',
                        'subject' => 'Welcome to our course!',
                        'message_id' => 'msg_' . uniqid(),
                        'status' => 'sent',
                        'provider' => 'sendgrid',
                        'delivery_time_ms' => 1250
                    ];
                    break;
                case 'webhook':
                    $stepData[$actionId] = [
                        'response_status' => 200,
                        'response_body' => '{"success": true, "id": "abc123"}',
                        'response_id' => 'abc' . uniqid(),
                        'sent_at' => now()->toISOString(),
                        'url' => 'https://api.example.com/webhook',
                        'response_time_ms' => 850,
                        'headers' => [
                            'content-type' => 'application/json',
                            'x-request-id' => 'req_' . uniqid()
                        ]
                    ];
                    break;
                case 'delay':
                    $stepData[$actionId] = [
                        'started_at' => now()->subMinutes(5)->toISOString(),
                        'completed_at' => now()->toISOString(),
                        'duration' => '5 minutes',
                        'duration_seconds' => 300,
                        'status' => 'completed'
                    ];
                    break;
                default:
                    $stepData[$actionId] = [
                        'completed_at' => now()->toISOString(),
                        'status' => 'completed',
                        'execution_time_ms' => 500
                    ];
                    break;
            }
        }

        return $stepData;
    }

    /**
     * Execute the test action using Laravel Workflow approach
     */
    private function executeTestAction(Action $node): array
    {
        try {
            // For app actions, use the new app discovery system
            if ($node->type === 'app_action') {
                $metadata = $node->metadata ?? [];
                $appActionKey = $metadata['app_action_key'] ?? null;
                $appName = $metadata['app_name'] ?? null;

                if (!$appActionKey || !$appName) {
                    throw new \Exception('Action metadata missing app_action_key or app_name');
                }

                // Get discovered apps to find the action
                $discoveryService = new AppDiscoveryService();
                $apps = $discoveryService->discoverApps();

                // Convert app name to proper case for lookup
                $appKey = ucfirst(strtolower($appName));

                if (!isset($apps[$appKey])) {
                    throw new \Exception('App not found in discovery');
                }

                $appData = $apps[$appKey];

                // Find the action in the app's actions
                $actionData = null;
                foreach ($appData['actions'] as $appAction) {
                    if ($appAction['key'] === $appActionKey) {
                        $actionData = $appAction;
                        break;
                    }
                }

                if (!$actionData) {
                    throw new \Exception("Action '{$appActionKey}' not found in app '{$appKey}'");
                }

                // For testing purposes, return sample data based on the action type
                return [
                    'message' => "Action test completed successfully (using sample data for {$appActionKey})",
                    'data' => $this->generateActionTestData($node, $actionData),
                ];
            }

            // For other action types, return generic test data
            return [
                'message' => 'Action test completed successfully (using sample data)',
                'data' => [
                    'action_id' => $node->id,
                    'action_name' => $node->name,
                    'action_type' => $node->type,
                    'executed_at' => now()->toISOString(),
                    'status' => 'completed',
                    'result' => 'success',
                ],
            ];
        } catch (\Exception $e) {
            throw new \Exception("Action test failed: " . $e->getMessage());
        }
    }

    /**
     * Execute the test trigger by fetching real data from integration
     */
    private function executeTestTrigger(Trigger $trigger): array
    {
        try {
            if ($trigger->trigger_type === 'webhook') {
                // For webhook triggers, we can't fetch real data, so return sample data
                return [
                    'message' => 'Webhook trigger test completed (using sample data)',
                    'data' => $this->generateWebhookTestData($trigger),
                ];
            }

            // For integration triggers, use the new app discovery system
            $integration = $trigger->integration;
            if (!$integration) {
                throw new \Exception('Trigger is not associated with an integration');
            }

            // Get the app from the integration
            $app = $integration->app;
            if (!$app) {
                throw new \Exception('Integration app not found');
            }

            // Get discovered apps to find the trigger
            $discoveryService = new AppDiscoveryService();
            $apps = $discoveryService->discoverApps();

            // Convert app name to proper case for lookup
            $appKey = ucfirst(strtolower($app->key));

            if (!isset($apps[$appKey])) {
                throw new \Exception('App not found in discovery');
            }

            $appData = $apps[$appKey];

            // Find the trigger in the app's triggers
            $triggerData = null;
            foreach ($appData['triggers'] as $appTrigger) {
                if ($appTrigger['key'] === $trigger->trigger_key) {
                    $triggerData = $appTrigger;
                    break;
                }
            }

            if (!$triggerData) {
                throw new \Exception("Trigger '{$trigger->trigger_key}' not found in app '{$appKey}'");
            }

            // For testing purposes, return sample data based on the trigger type
            return [
                'message' => "Trigger test completed successfully (using sample data for {$trigger->trigger_key})",
                'data' => $this->generateTriggerTestData($trigger, $triggerData),
                'source' => 'test',
            ];
        } catch (\Exception $e) {
            throw new \Exception("Trigger test failed: " . $e->getMessage());
        }
    }

    /**
     * Generate sample test data for actions
     */
    private function generateActionTestData(Action $node, array $actionData): array
    {
        $arguments = $node->arguments ?? [];

        // Generate realistic sample data based on the action type
        switch ($actionData['key']) {
            case 'create_contact_tag':
                return [
                    'action_id' => $node->id,
                    'action_name' => $node->name,
                    'action_type' => $node->type,
                    'executed_at' => now()->toISOString(),
                    'status' => 'completed',
                    'result' => 'success',
                    'tag_created' => [
                        'id' => 'tag_' . uniqid(),
                        'name' => $arguments['name'] ?? 'Test Tag',
                        'contact_id' => $arguments['contact'] ?? '12345',
                        'created_at' => now()->toISOString(),
                    ],
                    'action_info' => [
                        'key' => $actionData['key'],
                        'name' => $actionData['label'] ?? $actionData['key'],
                        'description' => $actionData['description'] ?? '',
                    ]
                ];

            case 'create_member':
                return [
                    'action_id' => $node->id,
                    'action_name' => $node->name,
                    'action_type' => $node->type,
                    'executed_at' => now()->toISOString(),
                    'status' => 'completed',
                    'result' => 'success',
                    'member_created' => [
                        'id' => 'member_' . uniqid(),
                        'email' => $arguments['email'] ?? 'test@example.com',
                        'first_name' => $arguments['first_name'] ?? 'Test',
                        'last_name' => $arguments['last_name'] ?? 'User',
                        'tags' => $arguments['tags'] ?? '',
                        'created_at' => now()->toISOString(),
                    ],
                    'action_info' => [
                        'key' => $actionData['key'],
                        'name' => $actionData['label'] ?? $actionData['key'],
                        'description' => $actionData['description'] ?? '',
                    ]
                ];

            case 'send_email':
                return [
                    'action_id' => $node->id,
                    'action_name' => $node->name,
                    'action_type' => $node->type,
                    'executed_at' => now()->toISOString(),
                    'status' => 'completed',
                    'result' => 'success',
                    'email_sent' => [
                        'to' => $arguments['to'] ?? 'test@example.com',
                        'subject' => $arguments['subject'] ?? 'Test Email',
                        'body' => $arguments['body'] ?? 'Test email body',
                        'from' => $arguments['from'] ?? 'noreply@example.com',
                        'sent_at' => now()->toISOString(),
                        'message_id' => 'msg_' . uniqid(),
                    ],
                    'action_info' => [
                        'key' => $actionData['key'],
                        'name' => $actionData['label'] ?? $actionData['key'],
                        'description' => $actionData['description'] ?? '',
                    ]
                ];

            default:
                return [
                    'action_id' => $node->id,
                    'action_name' => $node->name,
                    'action_type' => $node->type,
                    'executed_at' => now()->toISOString(),
                    'status' => 'completed',
                    'result' => 'success',
                    'action_data' => [
                        'key' => $actionData['key'],
                        'arguments' => $arguments,
                        'timestamp' => now()->toISOString(),
                    ],
                    'action_info' => [
                        'key' => $actionData['key'],
                        'name' => $actionData['label'] ?? $actionData['key'],
                        'description' => $actionData['description'] ?? '',
                    ]
                ];
        }
    }

    /**
     * Generate sample test data for triggers
     */
    private function generateTriggerTestData(Trigger $trigger, array $triggerData): array
    {
        // Generate realistic sample data based on the trigger type
        switch ($trigger->trigger_key) {
            case 'new-purchase':
                return [
                    'purchase' => [
                        'id' => 'purchase_' . uniqid(),
                        'member_name' => 'John Doe',
                        'member_email' => 'john.doe@example.com',
                        'first_name' => 'John',
                        'last_name' => 'Doe',
                        'product_name' => 'Premium Course',
                        'product_type' => 'course',
                        'order_id' => 'ORDER-' . strtoupper(substr(uniqid(), -6)),
                        'amount' => 9999, // $99.99 in cents
                        'currency' => 'USD',
                        'payment_method' => 'credit_card',
                        'created_at' => now()->toISOString(),
                        'completed_at' => now()->toISOString(),
                        'offer' => [
                            'id' => 'offer_123',
                            'name' => 'Premium Course',
                            'price' => 9999,
                        ],
                    ],
                    'trigger_info' => [
                        'key' => $trigger->trigger_key,
                        'name' => $triggerData['label'] ?? $trigger->trigger_key,
                        'description' => $triggerData['description'] ?? '',
                    ]
                ];

            case 'order_created':
                return [
                    'order' => [
                        'id' => 'order_' . uniqid(),
                        'customer_name' => 'Jane Smith',
                        'customer_email' => 'jane.smith@example.com',
                        'total' => 14999, // $149.99 in cents
                        'currency' => 'USD',
                        'status' => 'completed',
                        'created_at' => now()->toISOString(),
                        'items' => [
                            [
                                'product_id' => 'prod_' . uniqid(),
                                'product_name' => 'Sample Product',
                                'quantity' => 1,
                                'price' => 14999,
                            ]
                        ],
                    ],
                    'trigger_info' => [
                        'key' => $trigger->trigger_key,
                        'name' => $triggerData['label'] ?? $trigger->trigger_key,
                        'description' => $triggerData['description'] ?? '',
                    ]
                ];

            default:
                return [
                    'trigger_data' => [
                        'id' => uniqid(),
                        'timestamp' => now()->toISOString(),
                        'type' => $trigger->trigger_key,
                    ],
                    'trigger_info' => [
                        'key' => $trigger->trigger_key,
                        'name' => $triggerData['label'] ?? $trigger->trigger_key,
                        'description' => $triggerData['description'] ?? '',
                    ]
                ];
        }
    }

    /**
     * Generate sample test data for webhook triggers
     */
    private function generateWebhookTestData(Trigger $trigger): array
    {
        // Generate realistic sample data based on common webhook patterns
        return [
            'trigger' => [
                'member_name' => 'John Doe',
                'member_email' => 'john.doe@example.com',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'product_name' => 'Premium Course',
                'product_type' => 'course',
                'order_id' => 'ORDER-' . strtoupper(substr(uniqid(), -6)),
                'amount' => 9999, // $99.99 in cents
                'currency' => 'USD',
                'payment_method' => 'credit_card',
                'coupon_code' => 'WELCOME10',
                'discount_amount' => 999, // $9.99 in cents
                'created_at' => now()->toISOString(),
                'completed_at' => now()->toISOString(),
                'order_items' => [
                    [
                        'product_id' => 'prod_' . uniqid(),
                        'product_name' => 'Premium Course',
                        'quantity' => 1,
                        'price' => 9999,
                    ]
                ],
            ],
            'webhook_info' => [
                'url' => $trigger->webhook_url,
                'method' => 'POST',
                'content_type' => 'application/json',
                'sample_payload' => 'This is what the webhook payload would look like',
            ]
        ];
    }

    /**
     * Get integration class by type
     */
    private function getIntegrationClass(string $type): string
    {
        $classes = [
            'kajabi' => \App\Modules\Integrations\Kajabi::class,
            // Add other integration classes here as needed
        ];

        if (!isset($classes[$type])) {
            throw new \Exception("Unknown integration type: {$type}");
        }

        return $classes[$type];
    }

    /**
     * Build test context for action execution
     */
    private function buildTestContext(array $testData, array $stepData = []): array
    {
        // Build trigger data from test inputs
        $triggerData = [
            'member_name' => $testData['trigger_member_name'] ?? 'Test User',
            'member_email' => $testData['test_recipient'] ?? $testData['trigger_member_email'] ?? 'test@example.com',
            'product_name' => $testData['trigger_product_name'] ?? 'Sample Product',
            'order_id' => $testData['trigger_order_id'] ?? 'TEST-' . uniqid(),
            'amount' => 9999, // $99.99 in cents
        ];

        // Build the context that will be passed to the executor
        $context = [
            'trigger' => $triggerData,
        ];

        // Add step data for template variables
        foreach ($stepData as $stepId => $stepOutput) {
            $context["step_{$stepId}"] = $stepOutput;
            $context[$stepId] = $stepOutput; // Zapier-style reference
        }

        return $context;
    }

    /**
     * Test email action
     */
    private function testEmailAction(array $arguments, array $testData, array $stepData = []): array
    {
        // Validate email configuration
        if (empty($arguments['recipients']) || empty($arguments['subject']) || empty($arguments['body'])) {
            throw new \Exception('Email action is missing required configuration (recipients, subject, or body)');
        }

        // Get test recipient
        $testRecipient = $testData['test_recipient'] ?? null;
        if (!$testRecipient) {
            throw new \Exception('Test recipient email is required');
        }

        if (!filter_var($testRecipient, FILTER_VALIDATE_EMAIL)) {
            throw new \Exception('Invalid test recipient email address');
        }

        // Build sample trigger data for template variables
        $triggerData = [
            'trigger' => [
                'member_name' => $testData['trigger_member_name'] ?? 'Test User',
                'member_email' => $testRecipient,
                'product_name' => $testData['trigger_product_name'] ?? 'Sample Product',
                'order_id' => $testData['trigger_order_id'] ?? 'TEST-' . uniqid(),
                'amount' => 9999, // $99.99 in cents
            ]
        ];

        // Combine trigger data with step data for template resolution
        $templateContext = array_merge($triggerData, $stepData);

        // Resolve template variables in email content
        $resolvedSubject = $this->resolveTemplateVariables($arguments['subject'], $templateContext);
        $resolvedBody = $this->resolveTemplateVariables($arguments['body'], $templateContext);

        // For testing, we'll simulate sending the email instead of actually sending it
        // In a real implementation, you might want to add a test mode flag
        $simulateOnly = true; // Could be made configurable

        if ($simulateOnly) {
            return [
                'message' => 'Email test completed successfully (simulated)',
                'data' => [
                    'recipient' => $testRecipient,
                    'subject' => $resolvedSubject,
                    'body_preview' => substr(strip_tags($resolvedBody), 0, 100) . '...',
                    'template_variables_resolved' => $triggerData['trigger'],
                    'step_variables_used' => $this->extractStepVariablesUsed($arguments['subject'] . ' ' . $arguments['body'], $stepData),
                    'simulated' => true,
                    'would_send' => true
                ]
            ];
        } else {
            // In production, you could actually send a test email here
            // Mail::to($testRecipient)->send(new TestEmail($resolvedSubject, $resolvedBody));

            return [
                'message' => 'Test email sent successfully',
                'data' => [
                    'recipient' => $testRecipient,
                    'subject' => $resolvedSubject,
                    'sent_at' => now()->toISOString(),
                    'template_variables_resolved' => $triggerData['trigger']
                ]
            ];
        }
    }

    /**
     * Test webhook action
     */
    private function testWebhookAction(array $arguments, array $testData, array $stepData = []): array
    {
        // Validate webhook configuration
        if (empty($arguments['url'])) {
            throw new \Exception('Webhook action is missing URL configuration');
        }

        $url = $arguments['url'];
        $method = $arguments['method'] ?? 'POST';
        $payload = $arguments['payload'] ?? '{}';

        // Validate URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \Exception('Invalid webhook URL');
        }

        // Build sample trigger data
        $triggerData = [
            'trigger' => [
                'member_email' => $testData['trigger_member_email'] ?? 'test@example.com',
                'order_id' => $testData['trigger_order_id'] ?? 'TEST-' . uniqid(),
                'amount' => 9999,
                'product_name' => 'Sample Product',
                'created_at' => now()->toISOString()
            ]
        ];

        // Combine trigger data with step data for template resolution
        $templateContext = array_merge($triggerData, $stepData);

        // Resolve template variables in payload
        $resolvedPayload = $this->resolveTemplateVariables($payload, $templateContext);

        // Validate JSON payload
        $decodedPayload = json_decode($resolvedPayload, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON in webhook payload: ' . json_last_error_msg());
        }

        $testMode = $testData['test_mode'] ?? 'simulate';

        if ($testMode === 'simulate') {
            return [
                'message' => 'Webhook test completed successfully (simulated)',
                'data' => [
                    'url' => $url,
                    'method' => $method,
                    'payload' => $decodedPayload,
                    'template_variables_resolved' => $triggerData['trigger'],
                    'step_variables_used' => $this->extractStepVariablesUsed($payload, $stepData),
                    'simulated' => true,
                    'would_send' => true
                ]
            ];
        } else {
            // Actually send the webhook request
            try {
                $response = \Http::timeout(10)->send($method, $url, [
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'NumiAutomation/1.0 (Test)',
                    ],
                    'body' => $resolvedPayload
                ]);

                return [
                    'message' => 'Webhook sent successfully',
                    'data' => [
                        'url' => $url,
                        'method' => $method,
                        'payload' => $decodedPayload,
                        'response_status' => $response->status(),
                        'response_body' => $response->body(),
                        'response_headers' => $response->headers(),
                        'sent_at' => now()->toISOString(),
                        'template_variables_resolved' => $triggerData['trigger']
                    ]
                ];
            } catch (\Exception $e) {
                throw new \Exception('Failed to send webhook: ' . $e->getMessage());
            }
        }
    }

    /**
     * Test delay action
     */
    private function testDelayAction(array $arguments, array $testData, array $stepData = []): array
    {
        // Validate delay configuration
        if (empty($arguments['duration'])) {
            throw new \Exception('Delay action is missing duration configuration');
        }

        $duration = $arguments['duration'];
        $simulateDelay = ($testData['simulate_delay'] ?? 'true') === 'true';

        // Parse duration (basic parsing for common formats)
        $parsedDuration = $this->parseDuration($duration);

        if ($simulateDelay) {
            return [
                'message' => 'Delay test completed successfully',
                'data' => [
                    'original_duration' => $duration,
                    'parsed_duration' => $parsedDuration,
                    'would_delay_for' => $parsedDuration['human'],
                    'delay_seconds' => $parsedDuration['seconds'],
                    'simulated' => true,
                    'note' => 'In actual workflow, execution would pause for this duration'
                ]
            ];
        } else {
            return [
                'message' => 'Delay configuration validated successfully',
                'data' => [
                    'original_duration' => $duration,
                    'parsed_duration' => $parsedDuration,
                    'is_valid' => $parsedDuration['valid'],
                    'validated_at' => now()->toISOString()
                ]
            ];
        }
    }

    /**
     * Extract which step variables were used in the template
     */
    private function extractStepVariablesUsed(string $template, array $stepData): array
    {
        $usedVariables = [];

        // Find all step variable references in the template
        preg_match_all('/\{\{\s*(\d+)__([^}]+)\s*\}\}/', $template, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $actionId = $match[1];
            $variablePath = $match[2];

            if (isset($stepData[$actionId])) {
                $usedVariables[] = [
                    'variable' => $match[0],
                    'action_id' => $actionId,
                    'path' => $variablePath,
                    'resolved_value' => $this->getNestedValue($stepData[$actionId], $variablePath)
                ];
            }
        }

        return $usedVariables;
    }

    /**
     * Get nested value from array using dot notation
     */
    private function getNestedValue(array $data, string $path)
    {
        $keys = explode('.', $path);
        $value = $data;

        foreach ($keys as $key) {
            // Handle array notation like "items[0]"
            if (preg_match('/([^[]+)\[(\d+)\]/', $key, $matches)) {
                $arrayKey = $matches[1];
                $index = (int) $matches[2];

                if (isset($value[$arrayKey][$index])) {
                    $value = $value[$arrayKey][$index];
                } else {
                    return null;
                }
            } else {
                if (isset($value[$key])) {
                    $value = $value[$key];
                } else {
                    return null;
                }
            }
        }

        return $value;
    }

    /**
     * Parse duration string into seconds and human readable format
     */
    private function parseDuration(string $duration): array
    {
        $duration = trim(strtolower($duration));

        // Common patterns
        $patterns = [
            '/(\d+)\s*second[s]?/' => 1,
            '/(\d+)\s*minute[s]?/' => 60,
            '/(\d+)\s*hour[s]?/' => 3600,
            '/(\d+)\s*day[s]?/' => 86400,
            '/(\d+)\s*week[s]?/' => 604800,
        ];

        foreach ($patterns as $pattern => $multiplier) {
            if (preg_match($pattern, $duration, $matches)) {
                $value = (int) $matches[1];
                $seconds = $value * $multiplier;

                $unit = $multiplier === 1 ? 'second' :
                       ($multiplier === 60 ? 'minute' :
                       ($multiplier === 3600 ? 'hour' :
                       ($multiplier === 86400 ? 'day' : 'week')));

                $plural = $value === 1 ? $unit : $unit . 's';

                return [
                    'valid' => true,
                    'seconds' => $seconds,
                    'human' => "{$value} {$plural}",
                    'parsed_value' => $value,
                    'parsed_unit' => $unit
                ];
            }
        }

        return [
            'valid' => false,
            'seconds' => 0,
            'human' => 'Invalid duration format',
            'error' => 'Could not parse duration. Use formats like: "5 minutes", "1 hour", "2 days"'
        ];
    }

    /**
     * Resolve template variables in a string
     */
    private function resolveTemplateVariables(string $template, array $context): string
    {
        return preg_replace_callback('/\{\{\s*(.*?)\s*\}\}/', function($matches) use ($context) {
            $variable = $matches[1];

            // Handle step variables: {{action_id__field.subfield}}
            if (preg_match('/^(\d+)__(.+)$/', $variable, $stepMatches)) {
                $actionId = $stepMatches[1];
                $fieldPath = $stepMatches[2];

                if (isset($context[$actionId])) {
                    return $this->getNestedValue($context[$actionId], $fieldPath) ?? $matches[0];
                }

                return $matches[0]; // Return original if step data not found
            }

            // Handle dot notation: trigger.order_id
            if (str_contains($variable, '.')) {
                $parts = explode('.', $variable);
                $value = $context;

                foreach ($parts as $part) {
                    if (is_array($value) && isset($value[$part])) {
                        $value = $value[$part];
                    } else {
                        return $matches[0]; // Return original if not found
                    }
                }

                return $value;
            }

            // Direct variable access
            return $context[$variable] ?? $matches[0];
        }, $template);
    }

    /**
     * Authorize access to sequence based on organization
     */
    protected function authorize($ability, $sequence)
    {
        $organizationId = Auth::user()->currentOrganization->id;

        if ($sequence->organization_id !== $organizationId) {
            abort(403, 'You do not have permission to access this sequence.');
        }
    }

    /**
     * Authorize access to integration based on organization
     */
    protected function authorizeIntegration($integration)
    {
        $organizationId = Auth::user()->currentOrganization->id;

        if ($integration->organization_id !== $organizationId) {
            abort(403, 'You do not have permission to access this integration.');
        }
    }

    /**
     * Search discovered apps with filters and pagination.
     * Handles GET /automation/apps
     */
    public function searchApps(Request $request)
    {
        $validated = $request->validate([
            'q' => 'nullable|string',
            'category' => 'nullable|string',
            'provider' => 'nullable|string',
            'page' => 'nullable|integer|min:1',
        ]);

        // TODO: Replace with actual discovery logic
        $apps = collect([
            [
                'id' => 1,
                'name' => 'Example App',
                'category' => 'crm',
                'provider' => 'internal',
            ],
            [
                'id' => 2,
                'name' => 'Another App',
                'category' => 'marketing',
                'provider' => 'external',
            ],
        ]);

        // Filter by search query
        if (!empty($validated['q'])) {
            $apps = $apps->filter(fn($app) => str_contains(strtolower($app['name']), strtolower($validated['q'])));
        }
        if (!empty($validated['category'])) {
            $apps = $apps->where('category', $validated['category']);
        }
        if (!empty($validated['provider'])) {
            $apps = $apps->where('provider', $validated['provider']);
        }

        // Paginate (stubbed)
        $perPage = 10;
        $page = $validated['page'] ?? 1;
        $paginated = $apps->forPage($page, $perPage)->values();

        return response()->json([
            'data' => $paginated,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $apps->count(),
            ],
        ]);
    }
}
