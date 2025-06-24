<?php

namespace App\Observers;

use App\Enums\OnboardingStep;
use App\Models\Theme;

class ThemeObserver
{
    /**
     * Handle the Theme "created" event.
     */
    public function created(Theme $theme): void
    {
        // Mark theme customization as completed
        $organization = $theme->organization;
        if ($organization && !$organization->isOnboardingStepCompleted(OnboardingStep::THEME_CUSTOMIZATION)) {
            $organization->markOnboardingStepCompleted(OnboardingStep::THEME_CUSTOMIZATION);
        }
    }

    /**
     * Handle the Theme "updated" event.
     */
    public function updated(Theme $theme): void
    {
        // Also mark as completed on updates (in case they're customizing an existing theme)
        $organization = $theme->organization;
        if ($organization && !$organization->isOnboardingStepCompleted(OnboardingStep::THEME_CUSTOMIZATION)) {
            $organization->markOnboardingStepCompleted(OnboardingStep::THEME_CUSTOMIZATION);
        }
    }

    /**
     * Handle the Theme "deleted" event.
     */
    public function deleted(Theme $theme): void
    {
        //
    }

    /**
     * Handle the Theme "restored" event.
     */
    public function restored(Theme $theme): void
    {
        //
    }

    /**
     * Handle the Theme "force deleted" event.
     */
    public function forceDeleted(Theme $theme): void
    {
        //
    }
}
