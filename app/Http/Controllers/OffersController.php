<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Store\Offer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OffersController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('offers/index', [
            'offers' => Offer::paginate(),
        ]);
    }

    public function store(Request $request)
    {
        $offer = Offer::create([
            'name' => null,
            'status' => 'draft',
            'organization_id' => 1, // TODO: fix
        ]);

        return redirect()
            ->route('offers.edit', $offer)
            ->with('showNameDialog', true);
    }

    public function edit(Offer $offer): Response
    {
        return Inertia::render('offers/edit', [
            'offer' => $offer,
            'showNameDialog' => session('showNameDialog', false),
        ]);
    }

    public function update(Request $request, Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $offer->update($validated);

        return back();
    }

    public function destroy(Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $offer->delete();

        return redirect()->route('dashboard');
    }

    public function pricing(Offer $offer): Response
    {
        return Inertia::render('offers/pricing', [
            'offer' => $offer,
        ]);
    }

    public function integrate(Offer $offer): Response
    {
        return Inertia::render('offers/integrate', [
            'offer' => $offer,
        ]);
    }

    public function sharing(Offer $offer): Response
    {
        return Inertia::render('offers/sharing', [
            'offer' => $offer,
        ]);
    }

    public function settings(Offer $offer): Response
    {
        return Inertia::render('offers/settings', [
            'offer' => $offer,
        ]);
    }

    public function settingsCustomization(Offer $offer): Response
    {
        return Inertia::render('offers/settings/customization', [
            'offer' => $offer,
        ]);
    }

    public function settingsNotifications(Offer $offer): Response
    {
        return Inertia::render('offers/settings/notifications', [
            'offer' => $offer,
        ]);
    }

    public function settingsAccess(Offer $offer): Response
    {
        return Inertia::render('offers/settings/access', [
            'offer' => $offer,
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
