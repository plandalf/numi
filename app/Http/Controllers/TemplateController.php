<?php

namespace App\Http\Controllers;

use App\Http\Resources\TemplateResource;
use App\Models\Template;
use App\Services\TemplateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    protected TemplateService $templateService;

    public function __construct(TemplateService $templateService)
    {
        $this->templateService = $templateService;
    }

    /**
     * Display a listing of global templates.
     */
    public function index()
    {
        $templates = Template::query()
            ->global()
            ->with(['theme', 'organization'])
            ->orderBy('created_at', 'desc')
            ->get();

        $categories = Template::query()
            ->global()
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->values()
            ->all();

        return Inertia::render('templates/index', [
            'templates' => TemplateResource::collection($templates),
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
}
