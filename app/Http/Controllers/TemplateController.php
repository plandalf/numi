<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateUpdateTemplateRequest;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use App\Notifications\TemplateRequestNotification;
use App\Services\TemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
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

    public function store(CreateUpdateTemplateRequest $request)
    {
        $this->templateService->createTemplate([
            'organization_id' => $request->user()->current_organization_id,
            ...$request->validated(),
        ]);

        return redirect()->back()->with('success', 'Template created successfully');
    }

    public function update(Template $template, CreateUpdateTemplateRequest $request)
    {
        $this->templateService->updateTemplate(
            $template,
            [
                'organization_id' => $request->user()->current_organization_id,
                ...$request->validated(),
            ]
        );
        return redirect()->back()->with('success', 'Template updated successfully');
    }

    public function requestTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => ['required', 'string', 'max:2000'],
            'imageUrl' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        $organization = $user?->currentOrganization;

        Notification::route('slack', config('services.slack.notifications.channel'))
            ->notify(new TemplateRequestNotification(
                $validated['description'],
                $user,
                $organization,
                $validated['imageUrl'] ?? null
            ));

        return response()->json(['message' => 'Feedback sent successfully.']);
    }
}
