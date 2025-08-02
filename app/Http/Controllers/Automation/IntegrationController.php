<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\App;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class IntegrationController extends Controller
{
    /**
     * Display a listing of integrations.
     */
    public function index(Request $request)
    {
        // Check if this is an API request or web request
        if ($request->expectsJson()) {
            $integrations = Integration::with('app')
                ->where('organization_id', $request->user()->currentOrganization->id)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $integrations
            ]);
        }

        // For web requests, return Inertia view
        $appKey = $request->query('app_key');
        $app = App::query()
            ->when($appKey, function ($query) use ($appKey) {
                return $query->where('key', $appKey);
            })
            ->first();

        $integrations = Integration::with('app')
            ->where('organization_id', $request->user()->currentOrganization->id)
            ->where('app_id', $app->id)
            ->get();

        return \Inertia\Inertia::render('Automation/Integrations/Index', [
            'integrations' => $integrations,
            'appKey' => $appKey,
        ]);
    }

    /**
     * Show the form for creating a new integration.
     */
    public function create(Request $request)
    {
        $appKey = $request->query('app_key');
        $integrationName = $request->query('integration_name', '');

        if (!$appKey) {
            return response('App key is required', 400);
        }

        // Get app details
        $appDiscoveryService = app(\App\Services\AppDiscoveryService::class);
        $apps = $appDiscoveryService->getApps();
        $app = collect($apps)->firstWhere('key', $appKey);

        if (!$app) {
            return response('App not found', 404);
        }

        return \Inertia\Inertia::render('Automation/Integrations/Create', [
            'app' => $app,
            'integrationName' => $integrationName,
        ]);
    }

    /**
     * Show the form for editing an integration.
     */
    public function edit(Request $request, int $id)
    {
        $integration = Integration::with('app')
            ->where('organization_id', $request->user()->currentOrganization->id)
            ->findOrFail($id);

        // Get app details for the integration
        $appDiscoveryService = app(\App\Services\AppDiscoveryService::class);
        $apps = $appDiscoveryService->getApps();
        $app = collect($apps)->firstWhere('key', $integration->app->key);

        return \Inertia\Inertia::render('Automation/Integrations/Edit', [
            'integration' => $integration,
            'app' => $app,
        ]);
    }

    /**
     * Store a newly created integration.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'app_key' => 'required|string',
            'name' => 'required|string|max:255',
            'type' => 'required|in:oauth,oauth_client_credentials,api_keys,webhook',
            'connection_config' => 'required|array',
        ]);

        // Find the app
        $app = App::where('key', $request->app_key)->first();
        if (!$app) {
            throw ValidationException::withMessages([
                'app_key' => ['App not found']
            ]);
        }

        // Create the integration
        $integration = Integration::create([
            'organization_id' => $request->user()->currentOrganization->id,
            'app_id' => $app->id,
            'name' => $request->name,
            'type' => $request->type,
            'connection_config' => $request->connection_config,
            'current_state' => 'created',
            'environment' => 'live',
        ]);

        // Perform auth check after creation
        try {
            $authResult = $this->performAuthCheck($integration);

            // Update integration state based on auth result
            $integration->update([
                'current_state' => $authResult['success'] ? 'active' : 'error'
            ]);

            $response = [
                'success' => true,
                'data' => $integration->load('app'),
                'auth_check' => $authResult
            ];

            return response()->json($response, 201);

        } catch (\Exception $e) {
            // If auth check fails, mark as error but still return the integration
            $integration->update(['current_state' => 'error']);

            return response()->json([
                'success' => true,
                'data' => $integration->load('app'),
                'auth_check' => [
                    'success' => false,
                    'error' => $e->getMessage()
                ]
            ], 201);
        }
    }

    /**
     * Display the specified integration.
     */
    public function show($id): JsonResponse
    {
        $integration = Integration::with('app')
            ->where('organization_id', request()->user()->currentOrganization->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $integration
        ]);
    }

    /**
     * Update the specified integration.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'connection_config' => 'sometimes|array',
            'current_state' => 'sometimes|in:active,inactive,created,error',
        ]);

        $integration = Integration::where('organization_id', $request->user()->currentOrganization->id)
            ->with('app')
            ->findOrFail($id);

        $integration->update($request->only(['name', 'connection_config', 'current_state']));

        // If connection_config was updated, perform auth check
        if ($request->has('connection_config')) {
            try {
                $authResult = $this->performAuthCheck($integration);

                // Update integration state based on auth result
                $integration->update([
                    'current_state' => $authResult['success'] ? 'active' : 'error'
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $integration->load('app'),
                    'auth_check' => $authResult
                ]);

            } catch (\Exception $e) {
                // If auth check fails, mark as error but still return the integration
                $integration->update(['current_state' => 'error']);

                return response()->json([
                    'success' => true,
                    'data' => $integration->load('app'),
                    'auth_check' => [
                        'success' => false,
                        'error' => $e->getMessage()
                    ]
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $integration->load('app')
        ]);
    }

    /**
     * Test an integration
     */
    public function test(Request $request, int $id): JsonResponse
    {
        try {
            $integration = Integration::where('organization_id', $request->user()->currentOrganization->id)
                ->with('app')
                ->findOrFail($id);

            // Use the app's test method instead of hardcoded type checking
            $appClass = "App\\Apps\\{$integration->app->name}\\{$integration->app->name}App";

            if (!class_exists($appClass)) {
                throw new \Exception("App class not found: {$appClass}");
            }

            $app = new $appClass();
            $result = $app->test($integration);

            return response()->json([
                'success' => true,
                'message' => $result['message'] ?? 'Integration test successful',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Integration test failed: ' . $e->getMessage()
            ], 422);
        }
    }

    private function performAuthCheck(Integration $integration): array
    {
        try {
            // Get the app class
            $appClass = "App\\Apps\\{$integration->app->name}\\{$integration->app->name}App";

            if (!class_exists($appClass)) {
                throw new \Exception("App class not found: {$appClass}");
            }

            $app = new $appClass();

            // Use the app's test method instead of hardcoded logic
            $result = $app->test($integration);

            return [
                'success' => true,
                'message' => $result['message'] ?? 'Authentication successful',
                'tested_at' => now()->toISOString()
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'tested_at' => now()->toISOString()
            ];
        }
    }

    /**
     * Remove the specified integration.
     */
    public function destroy($id): JsonResponse
    {
        $integration = Integration::where('organization_id', request()->user()->currentOrganization->id)
            ->findOrFail($id);

        $integration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Integration deleted successfully'
        ]);
    }
}
