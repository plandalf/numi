<?php

namespace App\Observers;

use App\Enums\IntegrationType;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Stripe\Provider as StripeSocialiteProvider;

class ExtendSocialiteObserver
{
    public function __invoke(SocialiteWasCalled $socialiteWasCalled)
    {
        $socialiteWasCalled->extendSocialite(IntegrationType::STRIPE_TEST->value, StripeSocialiteProvider::class);
        $socialiteWasCalled->extendSocialite(IntegrationType::STRIPE->value, StripeSocialiteProvider::class);
    }
}
