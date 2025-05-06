<?php

namespace App\Services;

use App\Models\Theme;

class ThemeService
{
    public function getGlobalThemes()
    {
        return Theme::query()
            ->global()
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getOrganizationThemes($organizationId, $withoutOffer = false)
    {
        $query = Theme::query()
            ->where('organization_id', $organizationId)
            ->orderBy('created_at', 'desc');

        if ($withoutOffer) {
            $query->whereDoesntHave('offer');
        }

        return $query->get();
    }

    public function createTheme(array $data) 
    {
        return Theme::create($data);
    }

    public function updateTheme(Theme $theme, array $data) 
    {
        return $theme->update($data);
    }
}
