<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function billing(Request $request)
    {
        if (! config('cashier.enable_billing')) {
            return redirect()->route('dashboard');
        }

        $intent = $request->has('intent') ? $request->input('intent') : null;

        $response = Inertia::render('organizations/settings/billing');

        if ($intent && $intent === 'checkout_success') {
            return $response->with('flash', [
                'success' => 'Congratulations! Your subscription has been successfully updated.',
            ]);
        }

        return $response;
    }

    public function checkout(Request $request)
    {
        $organization = request()->user()->currentOrganization;

        if (! $organization->hasStripeId()) {
            $organization->createAsStripeCustomer();
        }

        return $organization
            ->newSubscription('default', config('cashier.stripe_plandalf_price_id'))
            ->checkout([
                'success_url' => route('organizations.settings.billing.index', [
                    'intent' => 'checkout_success',
                ]),
                'cancel_url' => route('organizations.settings.billing.index'),
            ]);
    }

    public function portal(Request $request)
    {
        /** @var \App\Models\Organization $organization */
        $organization = request()->user()->currentOrganization;

        return $organization->redirectToBillingPortal(
            route('organizations.settings.billing.index')
        );
    }
}
