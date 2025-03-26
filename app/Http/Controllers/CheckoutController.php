<?php

namespace App\Http\Controllers;

use App\Models\Store\Offer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function show(Request $request, string $offerId, string $environment = 'live')
    {
        $variant = $request->query('variant');
        $offer = Offer::retrieve($offerId);

        return Inertia::render('Checkout', [
            'offer' => $offer,
//                'url' => $url,
            'error' => null,
//                'agentToken' => $this->agentTokenService->generateToken('user_' . auth()->id() ?? 'guest'),
            'collectorId' => Str::uuid(),
            'embedDomain' => config('services.plandalf.embed_domain'),
            'environment' => $environment,
            'variant' => $variant,
//                'variantFilters' => $variantFilters,
        ]);
    }
}
