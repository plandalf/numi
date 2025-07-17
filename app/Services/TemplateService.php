<?php

namespace App\Services;

use App\Models\HostedPage;
use App\Models\Organization;
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
            $organization = Organization::find($organizationId);

            $hostedPage = HostedPage::create([
                'organization_id' => $organization->id,
                'style' => $template->hosted_page_style,
                'appearance' => $template->hosted_page_appearance,
            ]);

            $offer = new Offer;
            $offer->organization_id = $organizationId;
            $offer->name = $template->name;
            $offer->view = $template->view;
            $offer->theme_id = optional($template->theme)->id;
            $offer->hosted_page_id = $hostedPage->id;
            $offer->save();

            return $offer;
        });
    }

    public function createTemplate(array $data)
    {
        return DB::transaction(function () use ($data) {
            $theme = $this->themeService->createTheme([
                ...$data['theme'],
                'organization_id' => $data['organization_id'],
                'name' => 'From Template: '.$data['name'],
            ]);

            $template = Template::create([
                'organization_id' => $data['organization_id'],
                'name' => $data['name'],
                'view' => $data['view'],
                'preview_images' => data_get($data, 'preview_images', []),
                'hosted_page_style' => data_get($data, 'hosted_page_style', []),
                'hosted_page_appearance' => data_get($data, 'hosted_page_appearance', []),
                'theme_id' => $theme->id,
            ]);
            return $template;
        });
    }

    public function updateTemplate(Template $template, array $data)
    {
        return DB::transaction(function () use ($template, $data) {
            $template->theme->update([
                ...$data['theme'],
            ]);

            $template->update([
                'view' => $data['view'],
                'preview_images' => data_get($data, 'preview_images', []),
                'hosted_page_style' => data_get($data, 'hosted_page_style', []),
                'hosted_page_appearance' => data_get($data, 'hosted_page_appearance', []),
            ]);
            return $template;
        });
    }
}
