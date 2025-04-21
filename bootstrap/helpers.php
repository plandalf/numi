<?php

use App\Enums\IntegrationType;
use App\Models\Integration;
use App\Modules\Integrations\Stripe\Stripe;

if (! function_exists('get_integration_client_class')) {
    function get_integration_client_class(Integration $integration)
    {
        return match($integration->type) {
            IntegrationType::STRIPE => new Stripe($integration),
            IntegrationType::STRIPE_TEST => new Stripe($integration),
        };
    }
}