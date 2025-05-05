<?php

namespace App\Http\Controllers;

use App\Http\Resources\OfferResource;
use App\Http\Resources\TemplateResource;
use App\Services\TemplateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected TemplateService $templateService
    ) {
    }

    public function index(Request $request)
    {
        $templates = $this->templateService->getGlobalTemplates();
        $categories = $this->templateService->getGlobalTemplateCategories();
        $offers = $request->user()
            ->currentOrganization
            ->offers()
            ->with(['theme', 'screenshot'])
            ->get();

        return Inertia::render('dashboard', [
            'templates' => TemplateResource::collection($templates),
            'categories' => $categories,
            'offers' => OfferResource::collection($offers),
        ]);
    }
}
