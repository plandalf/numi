<?php

namespace App\Http\Controllers;

use App\Enums\IntegrationType;
use App\Enums\OnboardingInfo;
use App\Models\Catalog\Product;
use App\Models\Integration;
use App\Models\Catalog\Price;
use App\Modules\Integrations\Contracts\HasPrices;
use App\Modules\Integrations\Contracts\HasProducts;
use App\Modules\Integrations\Contracts\SupportsAuthorization;
use App\Modules\Integrations\Services\IntegrationUpsertService;
use App\Modules\Integrations\Stripe\StripeAuth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Gate;

class IntegrationsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $organization = $user->currentOrganization;
        $integrations = $organization->integrations;

        return Inertia::render('integrations/index', [
            'integrations' => $integrations,
            'showIntegrationsTutorial' => !$user->hasSeenOnboardingInfo(OnboardingInfo::INTEGRATIONS_TUTORIAL),
        ]);
    }

    public function show(Integration $integration)
    {
        // Ensure the integration belongs to the user's organization
        Gate::authorize('view', $integration);

        // Get the organization's default currency for payment method filtering
        $currency = strtolower($integration->organization->default_currency ?? 'usd');

        return Inertia::render('integrations/show', [
            'integration' => [
                ...$integration->toArray(),
                'available_payment_methods' => $integration->getAvailablePaymentMethods($currency),
                'payment_only_methods' => $integration->getPaymentOnlyMethods($currency),
                'enabled_payment_methods' => $integration->getEnabledPaymentMethods(),
            ],
        ]);
    }

    public function updatePaymentMethods(Integration $integration, Request $request)
    {
        // Ensure the integration belongs to the user's organization
        Gate::authorize('update', $integration);

        // Get the organization's default currency for validation
        $currency = strtolower($integration->organization->default_currency ?? 'usd');
        
        // Get all available payment methods (both setup and payment-only)
        $allAvailablePaymentMethods = array_keys($integration->getAllPaymentMethods($currency));

        $request->validate([
            'payment_methods' => 'required|array',
            'payment_methods.*' => 'string|in:' . implode(',', $allAvailablePaymentMethods),
        ]);

        $integration->setEnabledPaymentMethods($request->input('payment_methods'));

        return redirect()->back()->with('success', 'Payment methods updated successfully.');
    }

    public function products(Integration $integration, Request $request)
    {
        $integrationClient = $integration->integrationClient();
        $importedProducts = Product::query()
            ->where('organization_id', $request->user()->currentOrganization->id)
            ->where('integration_id', $integration->id)
            ->get();

        if ($integrationClient instanceof HasProducts) {
            $allProducts = collect();
            $startingAfter = null;

            do {
                $params = [
                    'limit' => 100,
                    'active' => true,
                ];

                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $products = $integrationClient->getAllProducts($params);
                $allProducts = $allProducts->concat($products->data);

                $startingAfter = $products->has_more ? end($products->data)->id : null;
            } while ($startingAfter);

            $allProducts = $allProducts->map(function ($product) use ($importedProducts) {
                $importedProduct = $importedProducts->first(fn($importedProduct) => $importedProduct->gateway_product_id === $product->id);
                $product->imported = $importedProduct !== null;

                return $product;
            });
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

            $importedPrices = Price::query()
                ->where('organization_id', request()->user()->currentOrganization->id)
                ->where('integration_id', $integration->id)
                ->get();

            do {
                $params = [
                    'product' => $gatewayProductId,
                    'expand' => [
                        'data.tiers',
                    ],
                    'limit' => 100,
                    'active' => true,
                ];

                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $prices = $integrationClient->getAllPrices($params);
                $allPrices = $allPrices->concat($prices->data);

                $startingAfter = $prices->has_more ? end($prices->data)->id : null;
            } while ($startingAfter);

            $allPrices = $allPrices->map(function ($price) use ($importedPrices) {
                $importedPrice = $importedPrices->first(fn($importedPrice) => $importedPrice->gateway_price_id === $price->id);
                $price->imported = $importedPrice !== null;

                return $price;
            });
            return response()->json($allPrices->toArray());
        }

        return response()->json([]);
    }

    public function authorizeIntegration(string $integrationType, Request $request)
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
