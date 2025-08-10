<?php

namespace App\Http\Controllers;

use App\Actions\Price\DestroyPrice;
use App\Actions\Price\StorePrice;
use App\Actions\Price\UpdatePrice;
use App\Http\Requests\Price\ImportRequest;
use App\Http\Requests\Price\StoreRequest as PriceStoreRequest;
use App\Http\Requests\Price\UpdateRequest as PriceUpdateRequest;
use App\Http\Resources\PriceResource;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class PriceController extends Controller
{
    public function index($product)
    {
        $product = Product::retrieve($product);

        Gate::authorize('view', $product);

        return PriceResource::collection($product->prices);
    }

    /**
     * Store a newly created resource in storage.
     * Handles both standard form submissions (redirect) and JSON API requests (modal).
     */
    public function store(PriceStoreRequest $request, Product $product, StorePrice $storePrice)
    {
        // Enforce atomic switch when setting a new active price for same dimension
        $price = DB::transaction(function () use ($product, $request, $storePrice) {
            $validated = $request->validated();

            // When creating a list price marked active, end the current one by setting its active_until
            if (($validated['scope'] ?? 'list') === 'list' && ($validated['is_active'] ?? false)) {
                Price::query()
                    ->where('product_id', $product->id)
                    ->where('scope', 'list')
                    ->where('type', $validated['type'])
                    ->where('currency', $validated['currency'])
                    ->when(isset($validated['renew_interval']), function ($q) use ($validated) {
                        $q->where('renew_interval', $validated['renew_interval']);
                    }, function ($q) {
                        $q->whereNull('renew_interval');
                    })
                    ->whereNull('archived_at')
                    ->whereNull('deactivated_at')
                    ->update(['deactivated_at' => now()]);
            }

            return $storePrice($product, $request);
        });

        if ($request->wantsJson()) {
            return response()->json([
                'price' => $price,
                'product' => $product,
            ]);
        }

        return redirect()->route('products.show', [$product]);
    }

    public function import(ImportRequest $request, Product $product, StorePrice $storePrice): RedirectResponse
    {
        $price = $storePrice($product, $request);

        return redirect()->route('products.show', [$product])
            ->with('success', 'Price imported successfully.'); // Optional success message
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PriceUpdateRequest $request, Product $product, Price $price, UpdatePrice $updatePrice)
    {
        $price = DB::transaction(function () use ($product, $price, $request, $updatePrice) {
            $validated = $request->validated();
            $isActive = $validated['is_active'] ?? null;

            if ($isActive === true && $price->scope === 'list') {
                // End current active price in same dimension
                Price::query()
                    ->where('product_id', $product->id)
                    ->where('scope', 'list')
                    ->where('type', $price->type)
                    ->where('currency', $price->currency)
                    ->when(!empty($price->renew_interval), function ($q) use ($price) {
                        $q->where('renew_interval', $price->renew_interval);
                    }, function ($q) {
                        $q->whereNull('renew_interval');
                    })
                    ->where('id', '!=', $price->id)
                    ->whereNull('archived_at')
                    ->whereNull('deactivated_at')
                    ->update(['deactivated_at' => now()]);
            }

            return $updatePrice($product, $price, $request);
        });

        if ($request->wantsJson()) {
            return response()->json([
                'price' => $price,
                'product' => $product,
            ]);
        }

        return redirect()->route('products.show', [$product])
            ->with('success', 'Price updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product, Price $price, DestroyPrice $destroyPrice): RedirectResponse
    {
        if ($price->product_id !== $product->id) {
            abort(403); // Can't delete price from wrong product
        }
        // Optional: Policy check: $this->authorize('delete', $price);

        $destroyPrice($product, $price); // Pass product for context if needed in action/policy

        // Redirect back after deletion
        return redirect()->route('products.show', [$product])
            ->with('success', 'Price deleted successfully.');
    }
}
