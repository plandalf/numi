<?php

namespace App\Services;

use App\Models\Template;
use App\Models\Store\Offer as Offer;
use App\Models\Theme;
use Illuminate\Support\Facades\DB;

class TemplateService
{
    /**
     * Create a new offer from a template.
     *
     * @param Template $template
     * @param int $organizationId
     * @return Offer
     */
    public function createOfferFromTemplate(Template $template, int $organizationId): Offer
    {
        return DB::transaction(function () use ($template, $organizationId) {
            // Create new theme by replicating template's theme
            $theme = null;
            if ($template->theme) {
                $theme = $template->theme->replicate();
                $theme->name = 'From Template: ' . $template->name;
                $theme->organization_id = $organizationId;
                $theme->save();
            }

            // Create new offer
            $offer = new Offer();
            $offer->organization_id = $organizationId;
            $offer->name = $template->name;
            $offer->view = $template->view;
            $offer->theme_id = $theme?->id;
            $offer->save();

            return $offer;
        });
    }
} 