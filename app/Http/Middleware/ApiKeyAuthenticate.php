<?php

namespace App\Http\Middleware;

use App\Services\ApiKeyService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuthenticate
{
    protected ApiKeyService $apiKeyService;

    public function __construct(ApiKeyService $apiKeyService)
    {
        $this->apiKeyService = $apiKeyService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $this->extractApiKey($request);

        if (!$apiKey) {
            return $this->unauthorizedResponse('API key is required');
        }

        $organization = $this->apiKeyService->validateApiKey($apiKey);

        if (!$organization) {
            return $this->unauthorizedResponse('Invalid API key');
        }

        // Set the organization in the request for use in controllers
        $request->merge(['api_organization' => $organization]);

        // Also set it in the container for dependency injection
        app()->instance('api_organization', $organization);

        return $next($request);
    }

    /**
     * Extract API key from the request
     */
    private function extractApiKey(Request $request): ?string
    {
        $authHeader = $request->bearerToken();

        if ($authHeader) {
            return $authHeader;
        }

        // Also check for API key in query parameter as fallback
        return $request->query('api_key');
    }

    /**
     * Return unauthorized response
     */
    private function unauthorizedResponse(string $message): JsonResponse
    {
        return response()->json([
            'error' => $message,
            'code' => 'UNAUTHORIZED'
        ], 401);
    }
}
