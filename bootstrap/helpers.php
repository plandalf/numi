<?php

use App\Enums\IntegrationType;
use App\Modules\Integrations\Stripe\Stripe;

if (! function_exists('get_integration_class')) {
    function get_integration_class(IntegrationType $integration)
    {
        return match($integration) {
            IntegrationType::STRIPE => app(Stripe::class),
            IntegrationType::STRIPE_TEST => app(Stripe::class),
        };
    }
}