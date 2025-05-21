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

        $integrations = Integration::query()
            ->where('organization_id', $organizationId)
            ->get();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
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

        return response()->json([
            'product' => $product,
        ]);
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

        return response()->json([
            'product' => $product,
        ]);
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
