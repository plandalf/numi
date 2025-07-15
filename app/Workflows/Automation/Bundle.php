<?php

namespace App\Workflows\Automation;

use App\Models\Integration;

class Bundle
{
    public array $input;
    public Integration $integration;
    public array $meta;

    public string $targetUrl;

    public function __construct(array $input = [])
    {
        $this->input = $input;
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
