<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateUpdateTemplateWithThemeRequest;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use App\Services\TemplateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function __construct(
        protected TemplateService $templateService)
    {
    }

    /**
     * Display a listing of global templates.
     */
    public function index(Request $request)
    {
        $globalTemplates = $this->templateService->getGlobalTemplates();
        $organizationTemplates = $this->templateService->getOrganizationTemplates($request->user()->current_organization_id);
        $categories = $this->templateService->getGlobalTemplateCategories();

        return Inertia::render('templates/index', [
            'globalTemplates' => TemplateResource::collection($globalTemplates),
            'organizationTemplates' => TemplateResource::collection($organizationTemplates),
            'categories' => $categories,
        ]);
    }

    /**
     * Use a template to create a new offer.
     */
    public function useTemplate(Template $template, Request $request)
    {
        $offer = $this->templateService->createOfferFromTemplate(
            $template,
            $request->user()->current_organization_id
        );

        return redirect()->route('offers.edit', $offer);
    }

    public function store(CreateUpdateTemplateWithThemeRequest $request)
    {
        $this->templateService->createTemplateWithTheme([
            'organization_id' => $request->user()->current_organization_id,
            ...$request->validated(),
        ]);

        return redirect()->back()->with('success', 'Template created successfully');
    }

    public function update(Template $template, CreateUpdateTemplateWithThemeRequest $request)
    {
        $this->templateService->updateTemplateWithTheme(
            $template,
            [
                'organization_id' => $request->user()->current_organization_id,
                ...$request->validated(),
            ]
        );
        return redirect()->back()->with('success', 'Template updated successfully');
    }
}
