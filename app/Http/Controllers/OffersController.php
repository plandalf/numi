<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreOfferVariantRequest;
use App\Http\Requests\UpdateOfferVariantRequest;
use App\Http\Resources\OfferResource;
use App\Http\Resources\ProductResource;
use App\Models\Catalog\Product;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\Store\Slot;
use App\Http\Requests\Offer\OfferSlotUpdateRequest;
use App\Http\Requests\Offer\OfferThemeUpdateRequest;
use App\Http\Resources\ThemeResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Models\Store\Theme;

class OffersController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('offers/index', [
            'offers' => OfferResource::collection(Offer::with('variants')->paginate()),
        ]);
    }

    public function store(Request $request, Organization $organization)
    {
        $offer = Offer::query()->create([
            'name' => null,
            'status' => 'draft',
            'organization_id' => $organization->id,
        ]);

        $offer->slots()->create([
            'key' => 'primary',
            'name' => 'Primary Slot',
            'is_required' => true,
            'sort_order' => 0,
            'default_price_id' => null,
        ]);

        return redirect()
            ->route('offers.edit', $offer)
            ->with('showNameDialog', true);
    }

    public function edit(Offer $offer): Response
    {
        // if (is_null($offer->view)) {
            $json = json_decode(file_get_contents(base_path('resources/view-example.json')), true);
            $offer->view = $json;
            $offer->save();
        // }

        return Inertia::render('offers/edit', [
            'offer' => new OfferResource($offer->load('slots')),
            'showNameDialog' => session('showNameDialog', false),
        ]);
    }

    public function update(Request $request, Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'url'],
            'properties' => ['nullable', 'array'],
            'view' => ['nullable', 'array'],
            'product_image_id' => ['nullable'],
        ]);

        $offer->update($validated);

        return back()->with('success', 'Product updated successfully');
    }

    public function destroy(Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $offer->slots()->delete();
        $offer->delete();

        return redirect()->route('offers.index')->with('success', 'Offer and all associated data deleted successfully');
    }

    public function pricing(Offer $offer): Response
    {
        // $this->authorizeOrganizationAccess($offer);

        $offer->load('slots.defaultPrice');

        $products = Product::query()
            ->where('organization_id', $offer->organization_id)
            ->with(['prices' => function ($query) {
                 $query->active();
            }])
            ->get();

        return Inertia::render('offers/pricing', [
            'offer' => new OfferResource($offer->load(['slots.defaultPrice'])),
            'products' => ProductResource::collection($products),
        ]);
    }

    public function storeSlot(OfferSlotStoreRequest $request, Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validated();
        $validated['offer_id'] = $offer->id;

        Slot::create($validated);

        return redirect()->route('offers.pricing', $offer)->with('success', 'Slot created successfully.');
    }

    public function updateSlot(OfferSlotUpdateRequest $request, Offer $offer, Slot $slot): \Illuminate\Http\RedirectResponse
    {
        // Authorization is handled by OfferSlotUpdateRequest
        $validated = $request->validated();
        // Update the slot with validated data
        $slot->update($validated);

        // Redirect back to the pricing page
        return redirect()->route('offers.pricing', $offer)->with('success', 'Slot updated successfully.');
    }

    public function storeVariant(StoreOfferVariantRequest $request, Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validated();
        $priceIds = $validated['price_ids'];
        unset($validated['price_ids']);

        $validated['offer_id'] = $offer->id;

        $variant = DB::transaction(function () use ($validated, $priceIds) {
            /* @var OfferVariant $newVariant */
            $newVariant = OfferVariant::create($validated);
            $newVariant->prices()->sync($priceIds);

            return $newVariant;
        });

        return back()->with('success', "Variant '{$variant->name}' created successfully");
    }

    public function updateVariant(UpdateOfferVariantRequest $request, Offer $offer, OfferVariant $variant): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validated();
        $priceIds = $validated['price_ids'];
        unset($validated['price_ids']);

        DB::transaction(function () use ($variant, $validated, $priceIds) {
            $variant->update($validated);
            $variant->prices()->sync($priceIds);
        });

        return back()->with('success', "Variant '{$variant->name}' updated successfully");
    }

    public function destroyVariant(Offer $offer, OfferVariant $variant): \Illuminate\Http\RedirectResponse
    {
        $name = $variant->name;
        $variant->delete();

        return back()->with('success', "Variant '{$name}' deleted successfully");
    }

    public function integrate(Offer $offer): Response
    {
        return Inertia::render('offers/integrate', [
            'offer' => new OfferResource($offer->load('slots')),
        ]);
    }

    public function sharing(Offer $offer): Response
    {
        return Inertia::render('offers/sharing', [
            'offer' => new OfferResource($offer->load('slots')),
        ]);
    }

    public function settings(Offer $offer): Response
    {
        return Inertia::render('offers/settings', [
            'offer' => new OfferResource($offer->load('slots')),
        ]);
    }

    public function settingsCustomization(Offer $offer): Response
    {
        return Inertia::render('offers/settings/customization', [
            'offer' => new OfferResource($offer->load('slots')),
        ]);
    }

    public function settingsNotifications(Offer $offer): Response
    {
        return Inertia::render('offers/settings/notifications', [
            'offer' => new OfferResource($offer->load('slots')),
        ]);
    }

    public function settingsAccess(Offer $offer): Response
    {
        return Inertia::render('offers/settings/access', [
            'offer' => new OfferResource($offer->load('slots')),
        ]);
    }

    public function settingsTheme(Offer $offer): Response
    {
        $themes = Theme::query()
            ->where('organization_id', $offer->organization_id)
            ->get();

        $currentTheme = $offer->theme_id ? $offer->theme : null;

        return Inertia::render('offers/settings/theme', [
            'offer' => new OfferResource($offer),
            'themes' => ThemeResource::collection($themes),
            'currentTheme' => $currentTheme ? new ThemeResource($currentTheme) : null,
        ]);
    }

    public function updateTheme(OfferThemeUpdateRequest $request, Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $offer->update([
            'theme_id' => $request->validated('theme_id'),
        ]);

        return back()->with('success', 'Theme updated successfully.');
    }

    public function publish(Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $offer->update([
            'status' => 'published',
        ]);

        return back()->with('success', 'Offer has been published successfully.');
    }

    private function authorizeOrganizationAccess(Offer $offer): void
    {
        if ($offer->organization_id !== Auth::user()->currentOrganization->id) {
            abort(403);
        }
    }
}
