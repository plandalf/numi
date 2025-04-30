<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequiresSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $organization = $request->user()->currentOrganization;

        // If billing is enabled and the organization is not subscribed and the trial period has expired, redirect to the no-access page
        if (
            config('cashier.enable_billing')
            && ! $organization->subscribed
            && (is_null($organization->trial_ends_at) || $organization->trial_period_expired)
        ) {
            return redirect()->route('no-access');
        }

        return $next($request);
    }
}
