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
        // $variant = $request->query('variant');
        $offer = Offer::retrieve($offerId);

        // $variant = $offer->variants->first();
        $json = json_decode(file_get_contents(base_path('resources/view-example.json')), true);
        $offer->view = $json;

        // checkout, if passed via a cart_token

        return Inertia::render('Checkout', [
            'offer' => $offer,
            'checkout' => '',
            'error' => null,
//                'agentToken' => $this->agentTokenService->generateToken('user_' . auth()->id() ?? 'guest'),
            'collectorId' => Str::uuid(),
            'embedDomain' => config('services.plandalf.embed_domain'),
            'environment' => $environment,
        ]);
    }
}
