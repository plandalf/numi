<?php

namespace App\Services;

use App\Models\Store\Offer;
use App\Models\Template;
use App\Models\Theme;
use Illuminate\Support\Facades\DB;

class TemplateService
{


    public function getGlobalTemplates()
    {
        return Template::query()
            ->global()
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
            // Create new theme by replicating template's theme
            $theme = null;
            if ($template->theme) {
                $theme = $template->theme->replicate();
                $theme->name = 'From Template: '.$template->name;
                $theme->organization_id = $organizationId;
                $theme->save();
            }

            // Create new offer
            $offer = new Offer;
            $offer->organization_id = $organizationId;
            $offer->name = $template->name;
            $offer->view = $template->view;
            $offer->theme_id = $theme?->id;
            $offer->save();

            return $offer;
        });
    }
}
