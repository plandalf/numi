<?php

namespace App\Http\Controllers;

use App\Enums\Store\OfferItemType;
use App\Http\Requests\Offer\OfferItemStoreRequest;
use App\Http\Requests\Offer\OfferItemUpdateRequest;
use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use App\Models\Store\OfferPrice;
use Illuminate\Http\RedirectResponse;

class OfferItemsController extends Controller {

    public function store(OfferItemStoreRequest $request, Offer $offer): RedirectResponse
    {
        $validated = $request->validated();

        $isRequired = ($validated['is_required'] || $offer->offerItems->count() === 0) && $validated['type'] === OfferItemType::STANDARD->value;
        $offerItem = OfferItem::create([
            'name' => $validated['name'],
            'key' => $validated['key'],
            'is_required' => $isRequired,
            'offer_id' => $offer->id,
            'type' => $validated['type'],
        ]);

        $prices = $validated['prices'];

        foreach ($prices as $key => $price) {
            $offerItem->offerPrices()->create([
                'price_id' => $price,
            ]);

            if ($key === 0 && $isRequired) {
                $offerItem->default_price_id = $price;
                $offerItem->save();
            }
        }

        return redirect()->back()->with('success', 'Offer item created successfully.');
    }

    public function update(OfferItemUpdateRequest $request, Offer $offer, OfferItem $item): RedirectResponse
    {
        $validated = $request->validated();
        $prices = $validated['prices'] ?? null;
        $name = $validated['name'] ?? null;
        $isRequired = $validated['is_required'] ?? null;
        $defaultPriceId = $validated['default_price_id'] ?? null;

        if($name) {
            $item->name = $name;
        }

        if ($defaultPriceId) {
            $item->default_price_id = $defaultPriceId;
        }

        if ($prices) {
            $item->offerPrices()->delete();
            foreach ($prices as $price) {
                OfferPrice::updateOrCreate(
                    [
                        'offer_item_id' => $item->id,
                        'price_id' => $price,
                    ],
                    [
                        'deleted_at' => null,
                    ]
                );
            }
        }

        if ($isRequired !== null) {
            $item->is_required = $isRequired;

            if (!$item->default_price_id) {
                $item->default_price_id = $item->offerPrices()->first()->price_id;
            }
        }

        if ($item->isDirty()) {
            $item->save();
        }

        // Redirect back to the pricing page
        return redirect()->back();
    }

    public function destroy(Offer $offer, OfferItem $item): RedirectResponse
    {
        $item->delete();
        $item->offerPrices()->delete();

        return redirect()->back();
    }
}
