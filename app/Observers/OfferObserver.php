<?php

namespace App\Observers;

use App\Enums\OnboardingStep;
use App\Jobs\TakeOfferScreenshotJob;
use App\Models\Store\Offer;

class OfferObserver
{
    /**
     * Handle the Offer "created" event.
     */
    public function created(Offer $offer): void
    {
        // Mark the "first offer" onboarding step as completed
        $organization = $offer->organization;
        if ($organization && !$organization->isOnboardingStepCompleted(OnboardingStep::FIRST_OFFER)) {
            $organization->markOnboardingStepCompleted(OnboardingStep::FIRST_OFFER);
        }
    }

    /**
     * Handle the Offer "updated" event.
     */
    public function updated(Offer $offer): void
    {
        logger()->info(logname(), ['offer' => $offer->id]);

        dispatch(new TakeOfferScreenshotJob($offer));
    }

    /**
     * Handle the Offer "deleted" event.
     */
    public function deleted(Offer $offer): void
    {
        //
    }

    /**
     * Handle the Offer "restored" event.
     */
    public function restored(Offer $offer): void
    {
        //
    }

    /**
     * Handle the Offer "force deleted" event.
     */
    public function forceDeleted(Offer $offer): void
    {
        //
    }
}
