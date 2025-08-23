<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DestroyProduct;
use App\Actions\Product\UpdateProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ProductStoreRequest;
use App\Http\Requests\Product\ProductUpdateRequest;
use App\Http\Resources\ProductResource;
use App\Models\Catalog\Product;
use App\Models\Integration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductAPIController extends Controller
{
    public function __construct(
        private readonly CreateProductAction $createProductAction,
    ) {
    }

    /**
     * GET /api/products
     * Searchable index used by editor comboboxes (returns minimal fields).
     */
    public function index(Request $request): JsonResponse
    {
        $organizationId = Auth::user()->currentOrganization->id;
        $search = (string) $request->input('search', '');

        $products = Product::query()
            ->where('organization_id', $organizationId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->select(['id', 'name'])
            ->orderBy('name')
            ->limit(20)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
            ]);

        return response()->json($products);
    }

    /**
     * GET /api/products/{product}
     */
    public function show(Product $product): ProductResource
    {
        $this->authorizeOrganizationAccess($product);

        return new ProductResource(
            $product->load(['prices', 'integration'])
        );
    }

    /**
     * POST /api/products
     */
    public function store(ProductStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['organization_id'] = Auth::user()->currentOrganization->id;

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

        return response()->json(['product' => new ProductResource($product)], 201);
    }

    /**
     * PUT/PATCH /api/products/{product}
     */
    public function update(ProductUpdateRequest $request, Product $product, UpdateProduct $updateProduct): JsonResponse
    {
        $this->authorizeOrganizationAccess($product);

        $product = $updateProduct($product, $request);

        return response()->json(['product' => new ProductResource($product)]);
    }

    /**
     * DELETE /api/products/{product}
     */
    public function destroy(Product $product, DestroyProduct $destroyProduct): JsonResponse
    {
        $this->authorizeOrganizationAccess($product);

        $destroyProduct($product);

        return response()->json(['deleted' => true]);
    }

    private function authorizeOrganizationAccess(Product $product): void
    {
        if ($product->organization_id !== Auth::user()->currentOrganization->id) {
            abort(403);
        }
    }
}


