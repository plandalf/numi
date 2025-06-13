<?php

namespace App\Http\Controllers;

use App\Http\Requests\Offer\OfferItemPriceUpdateRequest;
use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use App\Models\Store\OfferPrice;
use Illuminate\Http\RedirectResponse;

class OfferItemPriceController extends Controller {


    public function update(OfferItemPriceUpdateRequest $request, Offer $offer, OfferItem $item, string $priceId): RedirectResponse
    {
        $price = OfferPrice::where('price_id', $priceId)
            ->where('offer_item_id', $item->id)
            ->first();

        if (!$price) {
            return redirect()->back()->with('error', 'Price not found.');
        }

        $price->name = $request->name;
        $price->save();

        return redirect()->back();
    }

    public function destroy(OfferPrice $price): RedirectResponse
    {
        $price->delete();

        return redirect()->back();
    }
}
