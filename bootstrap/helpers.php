<?php

use App\Enums\IntegrationType;
use App\Models\Integration;
use App\Modules\Integrations\Stripe\Stripe;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

if (! function_exists('get_integration_client_class')) {
    function get_integration_client_class(Integration $integration)
    {
        return match($integration->type) {
            IntegrationType::STRIPE => new Stripe($integration),
            IntegrationType::STRIPE_TEST => new Stripe($integration),
            default => null, // TODO: create Plandalf integration client
        };
    }
}

/**
 * Returns the caller of this method nicely formatted for logging.
 * Will return a string like `MyController@index.argument`
 *
 * @param  mixed  ...$arguments
 */
function logname(...$arguments): string
{
    $caller = Arr::first(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS), function ($trace) {
        return ! in_array($trace['function'], ['logname']);
    });

    $callerName = class_basename(! is_null($caller) ? $caller['class'] : null);
    $callerFn = ! is_null($caller) ? $caller['function'] : null;

    return trim($callerName.'@'.$callerFn.Str::start(implode('.', Arr::flatten($arguments)), '.'), '.\\,@');
}
