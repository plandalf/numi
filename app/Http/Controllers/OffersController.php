<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\OfferResource;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\OfferVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
        $offer = Offer::create([
            'name' => null,
            'status' => 'draft',
            'organization_id' => $organization->id,
            'default_currency' => 'USD',
            'is_subscription_enabled' => false,
            'is_one_time_enabled' => true,
        ]);

        return redirect()
            ->route('offers.edit', $offer)
            ->with('showNameDialog', true);
    }

    public function edit(Offer $offer): Response
    {
        if (is_null($offer->view)) {
            $json = json_decode(file_get_contents(base_path('resources/view-example.json')), true);
            $offer->view = $json;
        }

        return Inertia::render('offers/edit', [
            'offer' => new OfferResource($offer->load('variants')),
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
        logger()->info('view: ', $validated);

        $offer->update($validated);

        return back()->with('success', 'Product updated successfully');
    }

    public function destroy(Offer $offer): \Illuminate\Http\RedirectResponse
    {
        try {
            // First delete all variants associated with this offer
            $offer->variants()->delete();
            
            // Then delete the offer itself
            $offer->delete();

            return redirect()->route('offers.index')->with('success', 'Offer and all associated data deleted successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete offer: ' . $e->getMessage());
        }
    }

    public function pricing(Offer $offer): Response
    {
        return Inertia::render('offers/pricing', [
            'offer' => new OfferResource($offer->load('variants')),
        ]);
    }

    public function storeVariant(Request $request, Offer $offer): \Illuminate\Http\RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'type' => ['required', 'string', 'in:one_time,subscription'],
                'pricing_model' => ['required', 'string', 'in:standard,graduated,volume,package'],
                'amount' => ['nullable', 'integer', 'min:0'],
                'currency' => ['required', 'string', 'size:3'],
                'properties' => ['required_if:pricing_model,graduated,volume,package'],
                'media_id' => ['nullable'],
            ]);

            $variant = $offer->variants()->create($validated);

            return back()->with('success', "Variant '{$variant->name}' created successfully");
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create variant: ' . $e->getMessage());
        }
    }

    public function updateVariant(Request $request, Offer $offer, OfferVariant $variant): \Illuminate\Http\RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'type' => ['required', 'string', 'in:one_time,subscription'],
                'pricing_model' => ['required', 'string', 'in:standard,graduated,volume,package'],
                'amount' => ['nullable', 'integer', 'min:0'],
                'currency' => ['required', 'string', 'size:3'],
                'properties' => ['nullable', 'array'],
                'media_id' => ['nullable'],
            ]);

            $variant->update($validated);

            return back()->with('success', "Variant '{$variant->name}' updated successfully");
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update variant: ' . $e->getMessage());
        }
    }

    public function destroyVariant(Offer $offer, OfferVariant $variant): \Illuminate\Http\RedirectResponse
    {
        try {
            $name = $variant->name;
            $variant->delete();

            return back()->with('success', "Variant '{$name}' deleted successfully");
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete variant: ' . $e->getMessage());
        }
    }

    public function integrate(Offer $offer): Response
    {
        return Inertia::render('offers/integrate', [
            'offer' => new OfferResource($offer->load('variants')),
        ]);
    }

    public function sharing(Offer $offer): Response
    {
        return Inertia::render('offers/sharing', [
            'offer' => new OfferResource($offer->load('variants')),
        ]);
    }

    public function settings(Offer $offer): Response
    {
        return Inertia::render('offers/settings', [
            'offer' => new OfferResource($offer->load('variants')),
        ]);
    }

    public function settingsCustomization(Offer $offer): Response
    {
        return Inertia::render('offers/settings/customization', [
            'offer' => new OfferResource($offer->load('variants')),
        ]);
    }

    public function settingsNotifications(Offer $offer): Response
    {
        return Inertia::render('offers/settings/notifications', [
            'offer' => new OfferResource($offer->load('variants')),
        ]);
    }

    public function settingsAccess(Offer $offer): Response
    {
        return Inertia::render('offers/settings/access', [
            'offer' => new OfferResource($offer->load('variants')),
        ]);
    }

    public function publish(Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $offer->update([
            'status' => 'published',
        ]);

        return back()->with('success', 'Offer has been published successfully.');
    }
}
