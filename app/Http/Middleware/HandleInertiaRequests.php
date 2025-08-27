<?php

namespace App\Http\Middleware;

use App\Enums\OnboardingInfo;
use App\Http\Resources\OrganizationResource;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    /**
     * Choose the Blade root view dynamically per request.
     */
    public function rootView(Request $request): string
    {
        if ($request->routeIs(
            'client.billing-portal.show',
            'client.billing*',
            'client.subscriptions.cancel*',
            'offers.show',
            'checkouts.*',
            'checkout.redirect.callback',
            'checkouts.mutations.store',
            'order-status.*'
        )) {
            return 'client';
        }

        return 'app';
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $isPortalRoute = $request->routeIs(
            'client.billing-portal.show',
            'client.billing*',
            'client.subscriptions.cancel*',
            'offers.show',
            'checkouts.*',
            'checkout.redirect.callback',
            'checkouts.mutations.store',
            'order-status.*',
        );

        $ziggy = new Ziggy($isPortalRoute ? 'portal' : null);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
//            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'current_organization' => $user->currentOrganization ? new OrganizationResource($user->currentOrganization) : null,
                    'organizations' => OrganizationResource::collection($user->organizations),
                    'onboarding_info' => [
                        'has_seen_products_tutorial' => $user->hasSeenOnboardingInfo(OnboardingInfo::PRODUCTS_TUTORIAL),
                        'has_seen_orders_tutorial' => $user->hasSeenOnboardingInfo(OnboardingInfo::ORDERS_TUTORIAL),
                        'has_seen_integrations_tutorial' => $user->hasSeenOnboardingInfo(OnboardingInfo::INTEGRATIONS_TUTORIAL),
                    ],
                ] : null,
            ],
            'ziggy' => fn (): array => [
                ...$ziggy->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'modules' => [
                'billing' => config('cashier.enable_billing'),
            ],
        ];
    }
}
