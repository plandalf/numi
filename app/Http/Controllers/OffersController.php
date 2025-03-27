<?php

declare(strict_types=1);

namespace App\Http\Controllers;

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
            'offers' => Offer::with('variants')->paginate(),
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
        $json = json_decode(file_get_contents(base_path('resources/view-example.json')), true);
        $offer->view = $json;

        return Inertia::render('offers/edit', [
            'offer' => $offer->load('variants'),
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
        $offer->delete();

        return redirect()->route('dashboard');
    }

    public function pricing(Offer $offer): Response
    {
        return Inertia::render('offers/pricing', [
            'offer' => $offer->load('variants'),
        ]);
    }

    public function storeVariant(Request $request, Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:one_time,subscription'],
            'pricing_model' => ['required', 'string', 'in:standard,graduated,volume,package'],
            'amount' => ['nullable', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'properties' => ['required_if:pricing_model,graduated,volume,package'],
        ]);

        $offer->variants()->create($validated);

        return back()->with('success', 'Variant created successfully');
    }

    public function updateVariant(Request $request, Offer $offer, OfferVariant $variant): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:one_time,subscription'],
            'pricing_model' => ['required', 'string', 'in:standard,graduated,volume,package'],
            'amount' => ['nullable', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'properties' => ['nullable', 'array'],
        ]);

        $variant->update($validated);

        return back()->with('success', 'Variant updated successfully');
    }

    public function destroyVariant(Offer $offer, OfferVariant $variant): \Illuminate\Http\RedirectResponse
    {
        $variant->delete();

        return back()->with('success', 'Variant deleted successfully');
    }

    public function integrate(Offer $offer): Response
    {
        return Inertia::render('offers/integrate', [
            'offer' => $offer->load('variants'),
        ]);
    }

    public function sharing(Offer $offer): Response
    {
        return Inertia::render('offers/sharing', [
            'offer' => $offer->load('variants'),
        ]);
    }

    public function settings(Offer $offer): Response
    {
        return Inertia::render('offers/settings', [
            'offer' => $offer->load('variants'),
        ]);
    }

    public function settingsCustomization(Offer $offer): Response
    {
        return Inertia::render('offers/settings/customization', [
            'offer' => $offer->load('variants'),
        ]);
    }

    public function settingsNotifications(Offer $offer): Response
    {
        return Inertia::render('offers/settings/notifications', [
            'offer' => $offer->load('variants'),
        ]);
    }

    public function settingsAccess(Offer $offer): Response
    {
        return Inertia::render('offers/settings/access', [
            'offer' => $offer->load('variants'),
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
