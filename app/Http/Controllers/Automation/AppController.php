<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\App;
use App\Services\AppDiscoveryService;

class AppController extends Controller
{
    public function __construct(
        private AppDiscoveryService $appDiscoveryService
    ) {}

    /**
     * List apps, with optional filters (including has_triggers).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $apps = $this->appDiscoveryService->getApps($request->all());
            return response()->json([
                'data' => $apps,
                'message' => 'Apps retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve apps: ' . $e->getMessage()
            ], 500);
        }
    }
} 