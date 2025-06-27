<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\IntegrationType;
use App\Enums\OnboardingStep;
use App\Enums\Theme\FontElement;
use App\Enums\Theme\WeightElement;
use App\Http\Requests\Offer\OfferThemeUpdateRequest;
use App\Http\Requests\StoreOfferVariantRequest;
use App\Http\Requests\UpdateOfferVariantRequest;
use App\Http\Requests\Offer\OfferCreateUpdateRequest;
use App\Http\Resources\FontResource;
use App\Http\Resources\OfferResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\TemplateResource;
use App\Http\Resources\ThemeResource;
use App\Models\Catalog\Product;
use App\Models\HostedPage;
use App\Models\Integration;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\Theme;
use App\Services\TemplateService;
use App\Services\ThemeService;
use App\Services\HostedPageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OffersController extends Controller
{
    public function __construct(
        protected TemplateService $templateService,
        protected ThemeService $themeService,
        protected HostedPageService $hostedPageService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('offers/index', [
            'offers' => OfferResource::collection(Offer::with([
                'organization',
            ])->paginate()),
        ]);
    }

    public function store(OfferCreateUpdateRequest $request, Organization $organization)
    {
        $offer = Offer::query()->create([
            'name' => null,
            'status' => 'draft',
            'organization_id' => $organization->id,
            'hosted_page_id' => $organization?->hostedPage
                ? $organization->hostedPage->id
                : HostedPage::getDefaultForOrganization($organization)->id,
            'view' => $request->view
        ]);

        $offer->load([
            'hostedPage.logoImage',
            'hostedPage.backgroundImage',
        ]);

        // Mark the "first offer" onboarding step as completed
        if (!$organization->isOnboardingStepCompleted(OnboardingStep::FIRST_OFFER)) {
            $organization->markOnboardingStepCompleted(OnboardingStep::FIRST_OFFER);
        }

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

        // If the offer has no hosted page, set the hosted page to the organization's hosted page
        if(!$offer->hosted_page_id && $offer->organization->hostedPage) {
            $offer->update([
                'hosted_page_id' => $offer->organization->hostedPage->id,
            ]);
        }

        $products = Product::query()
            ->where('organization_id', $offer->organization_id)
            ->with(['prices' => function ($query) {
                $query->active();
            }])
            ->get();

        // Load the offer with its theme and items
        $offer->load([
            'offerItems.prices.product',
            'theme',
            'screenshot',
            'organization',
            'hostedPage.logoImage',
            'hostedPage.backgroundImage',
        ]);

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

    public function update(OfferCreateUpdateRequest $request, Offer $offer)
    {
        $validated = $request->validated();

        // Remove hosted_page data from the main update
        if(isset($validated['hosted_page'])) {
            $hostedPageData = $validated['hosted_page'] ?? [];
            unset($validated['hosted_page']);

            $this->hostedPageService->updateViaOffer(
                $offer,
                $hostedPageData
            );
        }

        $offer->update($validated);

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

    public function duplicate(Offer $offer): \Illuminate\Http\RedirectResponse
    {
        $themeId = $offer->theme_id;
        
        // No need to duplicate if it's a global theme
        if($offer->theme->organization_id) {
            $newTheme = $offer->theme->replicate();
            $newTheme->name = (
                $offer->name 
                ? $offer->name . ' (Copy)'
                : ($offer->theme->name 
                    ? $offer->theme->name . ' (Copy)'
                    : null
                    )
                );
            $newTheme->updated_at = Carbon::now();
            $newTheme->created_at = Carbon::now();
            $newTheme->save();

            $themeId = $newTheme->id;
        }

        // Duplicate the offer
        $newOffer = $offer->replicate();
        $newOffer->uuid = null;
        $newOffer->name = $offer->name ? $offer->name . ' (Copy)' : null;
        $newOffer->theme_id = $themeId;
        $newOffer->updated_at = Carbon::now();
        $newOffer->created_at = Carbon::now();
        $newOffer->save();

        return redirect()
            ->route('offers.edit', $newOffer);
    }

    

    private function authorizeOrganizationAccess(Offer $offer): void
    {
        if ($offer->organization_id !== Auth::user()->currentOrganization->id) {
            abort(403);
        }
    }
}
