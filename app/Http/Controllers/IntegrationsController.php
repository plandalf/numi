<?php

namespace App\Http\Controllers;

use App\Enums\IntegrationType;
use App\Models\Integration;
use App\Modules\Integrations\Contracts\HasPrices;
use App\Modules\Integrations\Contracts\HasProducts;
use App\Modules\Integrations\Contracts\SupportsAuthorization;
use App\Modules\Integrations\Services\IntegrationUpsertService;
use App\Modules\Integrations\Stripe\StripeAuth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $organization = $user->currentOrganization;
        $integrations = $organization->integrations;

        return Inertia::render('integrations/index', [
            'integrations' => $integrations,
        ]);
    }

    public function show(Integration $integration)
    {
        return Inertia::render('integrations/show', [
            'integration' => $integration,
        ]);
    }

    public function products(Integration $integration)
    {
        $integrationClient = $integration->integrationClient();

        if ($integrationClient instanceof HasProducts) {
            $allProducts = collect();
            $startingAfter = null;

            do {
                $params = [
                    'limit' => 100,
                ];

                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $products = $integrationClient->getAllProducts($params);
                $allProducts = $allProducts->concat($products->data);

                $startingAfter = $products->has_more ? end($products->data)->id : null;
            } while ($startingAfter);

            return response()->json($allProducts->toArray());
        }

        return response()->json([]);
    }

    public function prices(Integration $integration, string $gatewayProductId)
    {
        $integrationClient = $integration->integrationClient();

        if ($integrationClient instanceof HasPrices) {
            $allPrices = collect();
            $startingAfter = null;

            do {
                $params = [
                    'product' => $gatewayProductId,
                    'expand' => [
                        'data.tiers',
                    ],
                    'limit' => 100,
                ];

                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $prices = $integrationClient->getAllPrices($params);
                $allPrices = $allPrices->concat($prices->data);

                $startingAfter = $prices->has_more ? end($prices->data)->id : null;
            } while ($startingAfter);

            return response()->json($allPrices->toArray());
        }

        return response()->json([]);
    }

    public function authorize(string $integrationType, Request $request)
    {
        $integrationClass = $this->getIntegrationAuthClass(IntegrationType::from($integrationType));

        if (! $integrationClass instanceof SupportsAuthorization) {
            throw new \Exception('Integration does not support authorization');
        }

        $url = $integrationClass->getAuthorizationUrl(IntegrationType::from($integrationType), $request);

        return Inertia::location($url);
    }

    public function callback(string $integrationType, Request $request)
    {
        $integrationClass = $this->getIntegrationAuthClass(IntegrationType::from($integrationType));

        if (! $integrationClass instanceof SupportsAuthorization) {
            throw new \Exception('Integration does not support authorization');
        }

        return $integrationClass->handleCallback(IntegrationType::from($integrationType), $request, app(IntegrationUpsertService::class));
    }

    public function getIntegrationAuthClass(IntegrationType $integration)
    {
        return match ($integration) {
            IntegrationType::STRIPE => app(StripeAuth::class),
            IntegrationType::STRIPE_TEST => app(StripeAuth::class),
        };
    }
}
