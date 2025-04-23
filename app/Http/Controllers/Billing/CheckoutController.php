<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;;

class CheckoutController extends Controller
{
    public function billing(Request $request)
    {
        return Inertia::render('organizations/settings/billing', []);
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