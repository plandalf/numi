<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\IntegrationType;
use App\Enums\Theme\FontElement;
use App\Enums\Theme\WeightElement;
use App\Http\Requests\Offer\OfferThemeUpdateRequest;
use App\Http\Requests\StoreOfferVariantRequest;
use App\Http\Requests\UpdateOfferVariantRequest;
use App\Http\Requests\Offer\OfferUpdateRequest;
use App\Http\Resources\FontResource;
use App\Http\Resources\OfferResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\TemplateResource;
use App\Http\Resources\ThemeResource;
use App\Models\Catalog\Product;
use App\Models\Integration;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\Theme;
use App\Services\TemplateService;
use App\Services\ThemeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OffersController extends Controller
{
    public function __construct(
        protected TemplateService $templateService,
        protected ThemeService $themeService
    ) {}

    public function index(): Response
    {
        return Inertia::render('offers/index', [
            'offers' => OfferResource::collection(Offer::with([])->paginate()),
        ]);
    }

    public function store(Request $request, Organization $organization)
    {
        $offer = Offer::query()->create([
            'name' => null,
            'status' => 'draft',
            'organization_id' => $organization->id,
        ]);

        $offer->offerItems()->create([
            'key' => 'primary',
            'name' => 'Primary Item',
            'is_required' => true,
            'sort_order' => 0,
            'default_price_id' => null,
        ]);

        return redirect()
            ->route('offers.edit', $offer)
            ->with('showNameDialog', true);
    }

    public function edit(Offer $offer, Request $request): Response
    {
        $organizationThemes = $this->themeService->getOrganizationThemes(
            $request->user()->current_organization_id
        );

        $globalThemes = $this->themeService->getGlobalThemes();

        $organizationTemplates = $this->templateService->getOrganizationTemplates(
            $request->user()->current_organization_id
        );

        $products = Product::query()
            ->where('organization_id', $offer->organization_id)
            ->with(['prices' => function ($query) {
                $query->active();
            }])
            ->get();

        // Load the offer with its theme and items
        $offer->load(['offerItems.prices.product', 'theme', 'screenshot']);

        $stripeIntegration = Integration::where('organization_id', $offer->organization_id)->where('type', IntegrationType::STRIPE)->first();

        return Inertia::render('offers/edit', [
            'offer' => new OfferResource($offer),
            'theme' => new ThemeResource($offer?->theme ?? new Theme),
            'showNameDialog' => session('showNameDialog', false),
            'organizationThemes' => ThemeResource::collection($organizationThemes),
            'organizationTemplates' => TemplateResource::collection($organizationTemplates),
            'globalThemes' => ThemeResource::collection($globalThemes),
            'fonts' => FontResource::collection(FontElement::cases()),
            'weights' => WeightElement::values(),
            'products' => ProductResource::collection($products),
            'publishableKey' => $stripeIntegration?->publishable_key,
        ]);
    }

    public function update(OfferUpdateRequest $request, Offer $offer)
    {
        $forUpdate = [];

        if ($request->validated('name')) {
            $forUpdate['name'] = $request->validated('name');
        }

        if ($request->validated('view')) {
            $forUpdate['view'] = $request->validated('view');
        }

        if ($request->validated('theme_id')) {
            $forUpdate['theme_id'] = $request->validated('theme_id');
        }

        $offer->update($forUpdate);

        return redirect()->back();
    }

    public function destroy(Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $offer->offerItems()->delete();
        $offer->delete();

        return redirect()->route('dashboard')->with('success', 'Offer and all associated data deleted successfully');
    }

    public function pricing(Offer $offer): Response
    {
        // $this->authorizeOrganizationAccess($offer);

        $offer->load('offerItems.defaultPrice');

        $products = Product::query()
            ->where('organization_id', $offer->organization_id)
            ->with(['prices' => function ($query) {
                $query->active();
            }])
            ->get();

        return Inertia::render('offers/pricing', [
            'offer' => new OfferResource($offer->load(['offerItems.defaultPrice'])),
            'products' => ProductResource::collection($products),
        ]);
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
            'offer' => new OfferResource($offer->load('offerItems')),
        ]);
    }

    public function sharing(Offer $offer): Response
    {
        return Inertia::render('offers/sharing', [
            'offer' => new OfferResource($offer->load('offerItems')),
        ]);
    }

    public function settings(Offer $offer): Response
    {
        return Inertia::render('offers/settings', [
            'offer' => new OfferResource($offer->load('offerItems')),
        ]);
    }

    public function settingsCustomization(Offer $offer): Response
    {
        return Inertia::render('offers/settings/customization', [
            'offer' => new OfferResource($offer->load('offerItems')),
        ]);
    }

    public function settingsNotifications(Offer $offer): Response
    {
        return Inertia::render('offers/settings/notifications', [
            'offer' => new OfferResource($offer->load('offerItems')),
        ]);
    }

    public function settingsAccess(Offer $offer): Response
    {
        return Inertia::render('offers/settings/access', [
            'offer' => new OfferResource($offer->load('offerItems')),
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
