<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\PriceResource;
use App\Http\Resources\ProductResource;
use App\Models\Catalog\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    public function index(Request $request): Response
    {
        $at = $request->query('at') ? Carbon::parse((string) $request->query('at')) : now();
        $currency = strtolower((string) $request->query('currency', 'usd'));
        $interval = $request->query('interval', 'month');

        $products = Product::query()
            ->where('organization_id', $request->user()->currentOrganization->id)
            ->activeAt($at)
            ->marketable()
            ->with(['prices' => function ($query) use ($currency, $interval, $at) {
                $query->listActiveAt($at)
                    ->where('currency', $currency)
                    ->where('type', 'recurring')
                    ->where('renew_interval', $interval)
                    ->orderByDesc('activated_at');
            }])
            ->orderBy('name')
            ->get();

        return Inertia::render('Pricing/Index', [
            'products' => ProductResource::collection($products),
            'filters' => [
                'at' => $at->toISOString(),
                'currency' => $currency,
                'interval' => $interval,
            ],
        ]);
    }
}


