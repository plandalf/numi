<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Services\AppDiscoveryService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class IntegrationSetupController extends Controller
{
    public function __construct(private AppDiscoveryService $appDiscoveryService)
    {
    }

    /**
     * Show integration setup popup
     */
    public function setupPopup(Request $request)
    {
        $appKey = $request->query('app_key');
        $integrationName = $request->query('integration_name', '');

        if (!$appKey) {
            return response('App key is required', 400);
        }

        // Get app details
        $apps = $this->appDiscoveryService->getApps();
        $app = collect($apps)->firstWhere('key', $appKey);

        if (!$app) {
            return response('App not found', 404);
        }

        return Inertia::render('Automation/IntegrationSetup', [
            'app' => $app,
            'integrationName' => $integrationName,
        ]);
    }

    /**
     * Handle integration auth setup.
     */
    public function auth(Request $request): Response
    {
        // TODO: Implement integration auth setup
        return response()->noContent();
    }

    /**
     * Handle integration webhook config setup.
     */
    public function webhook(Request $request): Response
    {
        // TODO: Implement integration webhook config setup
        return response()->noContent();
    }
}
