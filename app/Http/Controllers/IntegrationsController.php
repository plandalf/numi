<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Enums\IntegrationType;
use App\Modules\Integrations\Contracts\SupportsAuthorization;
use App\Modules\Integrations\Services\IntegrationUpsertService;
use App\Modules\Integrations\Stripe\Stripe;
use Illuminate\Http\Request;

class IntegrationsController extends Controller
{

    public function index(Request $request): Response
    {
        $user = $request->user();
        $organization = $user->currentOrganization;
        $integrations = $organization->integrations;

        return Inertia::render('integrations/index', [
            'integrations' => $integrations
        ]);
    }

    public function authorize(string $integrationType, Request $request)
    {
        $integrationClass = $this->getIntegrationClass(IntegrationType::from($integrationType));

        if(!$integrationClass instanceof SupportsAuthorization) {
            throw new \Exception('Integration does not support authorization');
        }

        $url = $integrationClass->getAuthorizationUrl(IntegrationType::from($integrationType), $request);

        return Inertia::location($url);
    }

    public function callback(string $integrationType, Request $request)
    {
        $integrationClass = $this->getIntegrationClass(IntegrationType::from($integrationType));

        if(!$integrationClass instanceof SupportsAuthorization) {
            throw new \Exception('Integration does not support authorization');
        }

        return $integrationClass->handleCallback(IntegrationType::from($integrationType), $request, app(IntegrationUpsertService::class));
    }


    public function getIntegrationClass(IntegrationType $integration)
    {
        return match($integration) {
            IntegrationType::STRIPE => app(Stripe::class),
            IntegrationType::STRIPE_TEST => app(Stripe::class),
        };
    }

}
