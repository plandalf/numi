<?php

namespace App\Http\Controllers;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DestroyProduct;
use App\Actions\Product\UpdateProduct;
use App\Enums\OnboardingInfo;
use App\Http\Requests\Product\ProductStoreRequest;
use App\Http\Requests\Product\ProductUpdateRequest;
use App\Http\Requests\Product\TransitionStateRequest;
use App\Enums\ProductState;
use App\Http\Resources\PriceResource;
use App\Http\Resources\ProductResource;
use App\Models\Catalog\Product;
use App\Models\Catalog\Price;
use App\Models\Integration;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductsController extends Controller
{
    public function __construct(
        private readonly CreateProductAction $createProductAction,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $organizationId = Auth::user()->currentOrganization->id;
        $search = request('search', '');
        $tab = request('tab', 'products');

        $at = request('at') ? Carbon::parse(request('at')) : null;
        $products = Product::query()
            ->where('organization_id', $organizationId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($at, function ($query) use ($at) {
                $query->activeAt($at);
            })
            ->with(['prices', 'integration'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $prices = Price::query()
            ->where('organization_id', $organizationId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->with('product')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $integrations = Integration::query()
            ->where('organization_id', $organizationId)
            ->get();

        // Create pagination links manually
        $formatPaginationLinks = function ($paginator) {
            $links = [];

            // Previous link
            $links[] = [
                'url' => $paginator->previousPageUrl(),
                'label' => '&laquo; Previous',
                'active' => false,
            ];

            // Page links
            foreach (range(1, $paginator->lastPage()) as $page) {
                if ($page === 1 || $page === $paginator->lastPage() ||
                    abs($paginator->currentPage() - $page) <= 1) {
                    $links[] = [
                        'url' => $paginator->url($page),
                        'label' => (string) $page,
                        'active' => $paginator->currentPage() === $page,
                    ];
                } elseif (abs($paginator->currentPage() - $page) === 2) {
                    // Add ellipsis
                    $links[] = [
                        'url' => null,
                        'label' => '...',
                        'active' => false,
                    ];
                }
            }

            // Next link
            $links[] = [
                'url' => $paginator->nextPageUrl(),
                'label' => 'Next &raquo;',
                'active' => false,
            ];

            return $links;
        };

        return Inertia::render('Products/Index', [
            'products' => [
                'data' => ProductResource::collection($products->items()),
                'links' => $formatPaginationLinks($products),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
            'prices' => [
                'data' => PriceResource::collection($prices->items()),
                'links' => $formatPaginationLinks($prices),
                'current_page' => $prices->currentPage(),
                'last_page' => $prices->lastPage(),
                'per_page' => $prices->perPage(),
                'total' => $prices->total(),
            ],
            'filters' => [
                'search' => $search,
                'tab' => $tab,
            ],
            'integrations' => $integrations->map(function (Integration $integration) {
                return [
                    'id' => $integration->getRouteKey(),
                    'name' => $integration->name,
                    'type' => $integration->type,
                ];
            }),
            'showProductsTutorial' => !Auth::user()->hasSeenOnboardingInfo(OnboardingInfo::PRODUCTS_TUTORIAL),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductStoreRequest $request)
    {
        $validated = $request->validated();
        $organizationId = Auth::user()->currentOrganization->id;
        $validated['organization_id'] = $organizationId;

        $product = null;
        if ($request->has('integration_id') && $request->input('integration_id') !== null) {
            /** @var Integration $integration */
            $integration = Integration::retrieve($request->input('integration_id'));
            $integrationClient = $integration->integrationClient();

            $product = $integrationClient->importProduct($validated);
        }

        if (! $product) {
            $product = $this->createProductAction->execute($validated);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'product' => $product,
            ]);
        }

        return redirect()->route('products.show', $product);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): Response
    {
        $this->authorizeOrganizationAccess($product);

        $product->load([
            'prices' => function ($query) {
                $query->latest();
            },
            'integration',
            'children',
        ]);

        $listPrices = $product->prices()
            ->list()
            ->get();

        $organizationId = Auth::user()->currentOrganization->id;
        $integrations = Integration::query()
            ->where('organization_id', $organizationId)
            ->get();

        // candidates for parent combobox: all products in org except current and children
        $parentCandidates = Product::query()
            ->where('organization_id', $organizationId)
            ->where('id', '!=', $product->id)
            ->orderBy('name')
            ->get(['id', 'name', 'lookup_key']);

        return Inertia::render('Products/Show', [
            'product' => new ProductResource($product),
            'prices' => PriceResource::collection($product->prices),
            'listPrices' => PriceResource::collection($listPrices),
            'integrations' => $integrations->map(function (Integration $integration) {
                return [
                    'id' => $integration->getRouteKey(),
                    'name' => $integration->name,
                    'type' => $integration->type,
                ];
            }),
            'children' => ProductResource::collection($product->children),
            'parentCandidates' => $parentCandidates->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'lookup_key' => $p->lookup_key,
            ]),
            'filters' => [
                'at' => request('at'),
                'currency' => request('currency'),
                'interval' => request('interval'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product): Response
    {
        $this->authorizeOrganizationAccess($product);

        return Inertia::render('Products/Edit', [
            'product' => $product->load('prices'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProductUpdateRequest $request, Product $product, UpdateProduct $updateProduct)
    {
        $product = $updateProduct($product, $request);

        if ($request->wantsJson()) {
            return response()->json([
                'product' => $product,
            ]);
        }

        return redirect()->route('products.show', $product);
    }

    public function transitionState(TransitionStateRequest $request, Product $product)
    {
        $this->authorizeOrganizationAccess($product);

        $to = ProductState::from($request->input('to'));

        // basic transition rules can be enforced here if needed
        $product->update([
            'current_state' => $to->value,
            'activated_at' => $to === ProductState::active && empty($product->activated_at) ? now() : $product->activated_at,
            'archived_at' => $to === ProductState::retired ? now() : ($to === ProductState::deprecated ? $product->archived_at : $product->archived_at),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['product' => new ProductResource($product->fresh())]);
        }

        return redirect()->back();
    }

    public function createVersion(Product $product)
    {
        $this->authorizeOrganizationAccess($product);

        $new = $product->replicate([
            'lookup_key', 'gateway_provider', 'gateway_product_id', 'archived_at', 'deleted_at', 'activated_at'
        ]);
        $new->parent_product_id = $product->id;
        $new->current_state = ProductState::testing;
        $new->activated_at = null;
        $new->save();

        // Optionally copy over list prices as inactive templates
        foreach ($product->prices()->list()->get() as $price) {
            $newPrice = $price->replicate(['gateway_price_id', 'archived_at', 'activated_at', 'deactivated_at']);
            $newPrice->product_id = $new->id;
            $newPrice->is_active = false;
            $newPrice->activated_at = null;
            $newPrice->deactivated_at = null;
            $newPrice->save();
        }

        return redirect()->route('products.show', $new);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product, DestroyProduct $destroyProduct): RedirectResponse
    {
        $this->authorizeOrganizationAccess($product);

        $destroyProduct($product);

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }

    private function authorizeOrganizationAccess(Product $product): void
    {
        if ($product->organization_id !== Auth::user()->currentOrganization->id) {
            abort(403);
        }
    }
}
