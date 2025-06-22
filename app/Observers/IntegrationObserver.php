<?php

namespace App\Observers;

use App\Enums\OnboardingStep;
use App\Models\Integration;

class IntegrationObserver
{
    /**
     * Handle the Integration "created" event.
     */
    public function created(Integration $integration): void
    {
        // Mark payment setup and integration setup as completed
        $organization = $integration->organization;
        if ($organization) {
            // Mark payment setup as completed (especially for Stripe integrations)
            if (!$organization->isOnboardingStepCompleted(OnboardingStep::PAYMENT_SETUP)) {
                $organization->markOnboardingStepCompleted(OnboardingStep::PAYMENT_SETUP);
            }
            
            // Mark integration setup as completed
            if (!$organization->isOnboardingStepCompleted(OnboardingStep::INTEGRATION_SETUP)) {
                $organization->markOnboardingStepCompleted(OnboardingStep::INTEGRATION_SETUP);
            }
        }
    }

    /**
     * Handle the Integration "updated" event.
     */
    public function updated(Integration $integration): void
    {
        //
    }

    /**
     * Handle the Integration "deleted" event.
     */
    public function deleted(Integration $integration): void
    {
        //
    }

    /**
     * Handle the Integration "restored" event.
     */
    public function restored(Integration $integration): void
    {
        //
    }

    /**
     * Handle the Integration "force deleted" event.
     */
    public function forceDeleted(Integration $integration): void
    {
        //
    }
}
