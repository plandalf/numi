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
    }
}
