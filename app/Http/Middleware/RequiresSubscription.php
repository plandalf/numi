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
    
        if (!$organization->subscribed() && $organization->trial_period_expired) {
            return redirect()->route('no-access');
        }

        return $next($request);
    }
}
