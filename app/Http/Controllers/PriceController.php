<?php

namespace App\Http\Controllers;

use App\Actions\Price\DestroyPrice;
use App\Actions\Price\StorePrice;
use App\Actions\Price\UpdatePrice;
use App\Http\Requests\Price\ImportRequest;
use App\Http\Requests\Price\StoreRequest as PriceStoreRequest;
use App\Http\Requests\Price\UpdateRequest as PriceUpdateRequest;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use Illuminate\Http\RedirectResponse;

class PriceController extends Controller
{
    /**
     * Store a newly created resource in storage.
     * Handles both standard form submissions (redirect) and JSON API requests (modal).
     */
    public function store(PriceStoreRequest $request, Product $product, StorePrice $storePrice)
    {
        // The StorePrice action likely handles the actual creation logic
        $price = $storePrice($product, $request);

        return response()->json([
            'price' => $price,
            'product' => $product,
        ]);
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
        // Authorization handled by PriceUpdateRequest
        $price = $updatePrice($product, $price, $request);

        return response()->json([
            'price' => $price,
            'product' => $product,
        ]);
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
