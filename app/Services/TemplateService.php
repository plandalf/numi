<?php

namespace App\Services;

use App\Models\Store\Offer;
use App\Models\Template;
use App\Models\Theme;
use Illuminate\Support\Facades\DB;

class TemplateService
{
    public function __construct(
        protected ThemeService $themeService
    ) {}

    public function getGlobalTemplates()
    {
        return Template::query()
            ->global()
            ->with(['theme', 'organization'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getOrganizationTemplates($organizationId)
    {
        return Template::query()
            ->where('organization_id', $organizationId)
            ->with(['theme', 'organization'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getGlobalTemplateCategories()
    {
        return Template::query()
            ->global()
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->values()
            ->all();
    }

    /**
     * Create a new offer from a template.
     */
    public function createOfferFromTemplate(Template $template, int $organizationId): Offer
    {
        return DB::transaction(function () use ($template, $organizationId) {
            $offer = new Offer;
            $offer->organization_id = $organizationId;
            $offer->name = $template->name;
            $offer->view = $template->view;
            $offer->theme_id = optional($template->theme)->id;
            $offer->save();

            return $offer;
        });
    }

    public function createTemplate(array $data) {
        return Template::create($data);
    }

    public function createTemplateWithTheme(array $data)
    {
        return DB::transaction(function () use ($data) {
            $theme = $this->themeService->createTheme([
                ...$data['theme'],
                'organization_id' => $data['organization_id'],
                'name' => 'From Template: '.$data['name'],
            ]);

            $template = $this->createTemplate([
                'organization_id' => $data['organization_id'],
                'name' => $data['name'],
                'view' => $data['view'],
                'preview_images' => data_get($data, 'preview_images', []),
                'theme_id' => $theme->id,
            ]);
            return $template;
        });
    }

    public function updateTemplateWithTheme(Template $template, array $data)
    {
        return DB::transaction(function () use ($template, $data) {
            $template->theme->update([
                ...$data['theme'],
            ]);

            $template->update([
                'view' => $data['view'],
                'preview_images' => data_get($data, 'preview_images', []),
            ]);
            return $template;
        });
    }
}
