<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Enums\IntegrationType;
use App\Models\Integration;
use App\Modules\Integrations\Contracts\HasProducts;
use App\Modules\Integrations\Contracts\SupportsAuthorization;
use App\Modules\Integrations\Services\IntegrationUpsertService;
use App\Modules\Integrations\Stripe\StripeAuth;
use Illuminate\Http\Request;
use App\Modules\Integrations\Contracts\HasPrices;

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

    public function show(Integration $integration)
    {
        $integrationClient = $integration->integrationClient();

        $products = collect([]);
        if($integrationClient instanceof HasProducts) {
            $params = ['limit' => request('per_page', 10)];

            if (request('starting_after')) {
                $params['starting_after'] = request('starting_after');
            }

            if (request('ending_before')) {
                $params['ending_before'] = request('ending_before');
            }

            if (request('search')) {
                $params['search'] = request('search');
                $products = $integrationClient->searchProducts($params);
            } else {
                $products = $integrationClient->getAllProducts($params);
            }
        }

        $prices = collect([]);
        if($integrationClient instanceof HasPrices) {
            $params = ['limit' => request('per_page', 10)];
            $prices = $integrationClient->getAllPrices($params);
        }

        $filters = ['per_page' => request('per_page', 10)];

        if (request('starting_after')) {
            $filters['starting_after'] = request('starting_after');
        }

        if (request('ending_before')) {
            $filters['ending_before'] = request('ending_before');
        }

        if (request('search')) {
            $filters['search'] = request('search');
        }

        return Inertia::render('integrations/show', [
            'integration' => $integration,
            'products' => $products,
            'prices' => $prices,
            'filters' => $filters
        ]);
    }

    public function authorize(string $integrationType, Request $request)
    {
        $integrationClass = $this->getIntegrationAuthClass(IntegrationType::from($integrationType));

        if(!$integrationClass instanceof SupportsAuthorization) {
            throw new \Exception('Integration does not support authorization');
        }

        $url = $integrationClass->getAuthorizationUrl(IntegrationType::from($integrationType), $request);

        return Inertia::location($url);
    }

    public function callback(string $integrationType, Request $request)
    {
        $integrationClass = $this->getIntegrationAuthClass(IntegrationType::from($integrationType));

        if(!$integrationClass instanceof SupportsAuthorization) {
            throw new \Exception('Integration does not support authorization');
        }

        return $integrationClass->handleCallback(IntegrationType::from($integrationType), $request, app(IntegrationUpsertService::class));
    }


    public function getIntegrationAuthClass(IntegrationType $integration)
    {
        return match($integration) {
            IntegrationType::STRIPE => app(StripeAuth::class),
            IntegrationType::STRIPE_TEST => app(StripeAuth::class),
        };
    }

}
