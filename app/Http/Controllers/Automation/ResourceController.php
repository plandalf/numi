<?php

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\AppDiscoveryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ResourceController extends Controller
{
    public function __construct(private AppDiscoveryService $appDiscoveryService)
    {
    }

    /**
     * Search for resources based on app, resource type, and query
     */
    public function search(Request $request, string $app, string $resource): JsonResponse
    {
        $request->merge([
            'app_key' => $app,
            'resource_key' => $resource,
        ]);

        $request->validate([
            'integration_id' => [
                'nullable',
                'integer',
                Rule::exists(Integration::class, 'id')
                    ->where(function ($query) use ($request) {
                        return $query->where('organization_id', $request->user()->currentOrganization->id);
                    }),
            ],
            'search' => 'sometimes|nullable|string',
        ]);

        try {
            $apps = $this->appDiscoveryService->getApps();
            $app = collect($apps)->firstWhere('key', $request->app_key);

            if (!$app) {
                return response()->json(['error' => 'App not found'], 404);
            }

            // Find the integration
            $integration = $request->user()->currentOrganization
                ->integrations()
                ->where('id', $request->integration_id)
                ->first();

            // Get the app class and find the resource
            $appClass = $app['class'];
            $appInstance = new $appClass();
            $resourceClasses = $appInstance->resources();

            $resourceClass = null;
            foreach ($resourceClasses as $class) {
                $metadata = $class::getMetadata();
                if ($metadata['key'] === $request->resource_key) {
                    $resourceClass = $class;
                    break;
                }
            }

            if (!$resourceClass) {
                return response()->json(['error' => 'Resource not found'], 404);
            }

            // Create resource instance and search
            $resource = new $resourceClass($integration);
            $results = $resource->search([
                'search' => $request->search,
            ]);

            return response()->json([
                'success' => true,
                'data' => $results,
            ]);

        } catch (\Exception $e) {
            // Don't swallow exceptions - return the actual error for debugging
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'type' => get_class($e),
            ], 422); // Use 422 for business logic errors instead of 500
        }
    }

    /**
     * Get a specific resource by ID
     */
    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'app_key' => 'required|string',
            'resource_key' => 'required|string',
            'integration_id' => 'required|integer|exists:integrations,id',
            'resource_id' => 'required|string',
        ]);

        try {
            $apps = $this->appDiscoveryService->getApps();
            $app = collect($apps)->firstWhere('key', $request->app_key);

            if (!$app) {
                return response()->json(['error' => 'App not found'], 404);
            }

            // Find the integration
            $integration = $request->user()->currentOrganization
                ->integrations()
                ->where('id', $request->integration_id)
                ->first();

            if (!$integration) {
                return response()->json(['error' => 'Integration not found'], 404);
            }

            // Get the app class and find the resource
            $appClass = $app['class'];
            $appInstance = new $appClass();
            $resourceClasses = $appInstance->resources();

            $resourceClass = null;
            foreach ($resourceClasses as $class) {
                $metadata = $class::getMetadata();
                if ($metadata['key'] === $request->resource_key) {
                    $resourceClass = $class;
                    break;
                }
            }

            if (!$resourceClass) {
                return response()->json(['error' => 'Resource not found'], 404);
            }

            // Create resource instance and get the specific resource
            $resource = new $resourceClass($integration);
            $result = $resource->get($request->resource_id);

            if (!$result) {
                return response()->json(['error' => 'Resource not found'], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get resource: ' . $e->getMessage(),
            ], 500);
        }
    }
}
