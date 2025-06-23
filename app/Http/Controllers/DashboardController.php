<?php

namespace App\Http\Controllers;

use App\Enums\OnboardingInfo;
use App\Http\Resources\OfferResource;
use App\Http\Resources\TemplateResource;
use App\Services\TemplateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected TemplateService $templateService;

    public function __construct(TemplateService $templateService)
    {
        $this->templateService = $templateService;
    }

    public function index(Request $request)
    {
        $globalTemplates = $this->templateService->getGlobalTemplates();
        $organizationTemplates = $this->templateService->getOrganizationTemplates($request->user()->current_organization_id);
        $categories = $this->templateService->getGlobalTemplateCategories();

        $offers = $request->user()
            ->currentOrganization
            ->offers()
            ->with(['theme', 'screenshot'])
            ->get();

        return Inertia::render('dashboard', [
            'globalTemplates' => TemplateResource::collection($globalTemplates),
            'organizationTemplates' => TemplateResource::collection($organizationTemplates),
            'categories' => $categories,
            'offers' => OfferResource::collection($offers),
            'showOffersTutorial' => !$request->user()->hasSeenOnboardingInfo(OnboardingInfo::OFFERS_TUTORIAL),
        ]);
    }
}
