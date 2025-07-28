<?php

namespace App\Workflows\Automation;

use App\Models\Integration;

class Bundle
{

    public function __construct(
        public ?array $input = [],
        public ?Integration $integration = null,
    )
    {
        $this->input = $input;
        // auth
        // example?
    }

    public function __invoke()
    {
        // TODO: Implement __invoke() method.
    }

    public function get($key)
    {
        return $this->input[$key] ?? null;
    }

    // these are for webhook create requests
    // subscribeData,
//    targetUrl
}
