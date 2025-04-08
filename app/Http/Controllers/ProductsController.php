<?php

namespace App\Http\Controllers;

use App\Actions\Product\DestroyProduct;
use App\Actions\Product\UpdateProduct;
use App\Http\Requests\Product\ProductStoreRequest;
use App\Http\Requests\Product\ProductUpdateRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\PriceResource;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $organizationId = Auth::user()->currentOrganization->id;
        $products = Product::query()
            ->where('organization_id', $organizationId)
            ->with('prices')
            ->latest()
            ->paginate(10);

        return Inertia::render('Products/Index', [
            'products' => $products,
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

        $product = Product::create($validated);

        return Inertia::render('Products/Show', [
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
                $query->active()->latest();
            },
        ]);

        $listPrices = $product->prices()
                              ->list()
                              ->active()
                              ->get();

        return Inertia::render('Products/Show', [
            'product' => new ProductResource($product),
            'prices' => PriceResource::collection($product->prices),
            'listPrices' => PriceResource::collection($listPrices),
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
    public function update(ProductUpdateRequest $request, Product $product, UpdateProduct $updateProduct): RedirectResponse
    {
        $product = $updateProduct($product, $request);

        return redirect()->route('products.show', $product)
            ->with('success', 'Product updated successfully.');
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
