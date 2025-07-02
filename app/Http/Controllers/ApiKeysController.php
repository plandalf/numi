<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Services\ApiKeyService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApiKeysController extends Controller
{
    protected ApiKeyService $apiKeyService;

    public function __construct(ApiKeyService $apiKeyService)
    {
        $this->apiKeyService = $apiKeyService;
    }

    /**
     * Display the API keys page
     */
    public function index(): Response
    {
        $organization = request()->user()->currentOrganization;
        $apiKeys = $this->apiKeyService->getOrganizationApiKeys($organization);

        return Inertia::render('organizations/settings/api-keys', [
            'apiKeys' => $apiKeys->map(function ($key) {
                return [
                    'id' => $key->id,
                    'name' => $key->name,
                    'key_preview' => $key->key_preview,
                    'prefix' => $key->prefix,
                    'is_active' => $key->is_active,
                    'last_used_at' => $key->last_used_at?->toISOString(),
                    'created_at' => $key->created_at->toISOString(),
                    'creator' => [
                        'id' => $key->creator->id,
                        'name' => $key->creator->name,
                        'email' => $key->creator->email,
                    ],
                ];
            }),
        ]);
    }

    /**
     * Store a new API key
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'prefix' => 'required|string|in:live,test',
        ]);

        $organization = $request->user()->currentOrganization;
        $user = $request->user();

        $result = $this->apiKeyService->generateApiKey(
            $organization,
            $user,
            $request->name,
            $request->prefix
        );

        return redirect()->back()->with([
            'success' => 'API key created successfully',
            'api_key' => $result['key'], // Show the key once in the session
        ]);
    }

    /**
     * Update an API key (name only)
     */
    public function update(Request $request, ApiKey $apiKey): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Check if user has access to this API key
        if ($apiKey->organization_id !== $request->user()->currentOrganization->id) {
            abort(403, 'Unauthorized access to API key');
        }

        $apiKey->update(['name' => $request->name]);

        return redirect()->back()->with('success', 'API key updated successfully');
    }

    /**
     * Archive (deactivate) an API key
     */
    public function archive(ApiKey $apiKey): RedirectResponse
    {
        // Check if user has access to this API key
        if ($apiKey->organization_id !== request()->user()->currentOrganization->id) {
            abort(403, 'Unauthorized access to API key');
        }

        $this->apiKeyService->archiveApiKey($apiKey);

        return redirect()->back()->with('success', 'API key archived successfully');
    }

    /**
     * Activate an API key
     */
    public function activate(ApiKey $apiKey): RedirectResponse
    {
        // Check if user has access to this API key
        if ($apiKey->organization_id !== request()->user()->currentOrganization->id) {
            abort(403, 'Unauthorized access to API key');
        }

        $this->apiKeyService->activateApiKey($apiKey);

        return redirect()->back()->with('success', 'API key activated successfully');
    }

    /**
     * Delete an API key
     */
    public function destroy(ApiKey $apiKey): RedirectResponse
    {
        // Check if user has access to this API key
        if ($apiKey->organization_id !== request()->user()->currentOrganization->id) {
            abort(403, 'Unauthorized access to API key');
        }

        $apiKey->delete();

        return redirect()->back()->with('success', 'API key deleted successfully');
    }

    /**
     * Reveal an API key (requires password confirmation)
     */
    public function reveal(Request $request, ApiKey $apiKey): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        // Check if user has access to this API key
        if ($apiKey->organization_id !== $request->user()->currentOrganization->id) {
            abort(403, 'Unauthorized access to API key');
        }

        // Verify password
        if (!Hash::check($request->password, $request->user()->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        return response()->json([
            'key' => $apiKey->key,
        ]);
    }
}
