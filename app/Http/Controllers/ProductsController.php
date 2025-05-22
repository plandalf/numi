<?php

namespace App\Http\Controllers;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DestroyProduct;
use App\Actions\Product\UpdateProduct;
use App\Http\Requests\Product\ProductStoreRequest;
use App\Http\Requests\Product\ProductUpdateRequest;
use App\Http\Resources\PriceResource;
use App\Http\Resources\ProductResource;
use App\Models\Catalog\Product;
use App\Models\Catalog\Price;
use App\Models\Integration;
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

        $products = Product::query()
            ->where('organization_id', $organizationId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
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
            'integrations' => $integrations,
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
            $integration = Integration::find($request->input('integration_id'));
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
        ]);

        $listPrices = $product->prices()
            ->list()
            ->get();

        $organizationId = Auth::user()->currentOrganization->id;
        $integrations = Integration::query()
            ->where('organization_id', $organizationId)
            ->get();

        return Inertia::render('Products/Show', [
            'product' => new ProductResource($product),
            'prices' => PriceResource::collection($product->prices),
            'listPrices' => PriceResource::collection($listPrices),
            'integrations' => $integrations,
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
