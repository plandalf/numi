<?php

namespace App\Workflows\Automation;

use App\Models\Integration;
use App\Models\Organization;

class Bundle
{
    public function __construct(
        public Organization $organization,
        public ?array $input = [],
        public ?array $configuration = [],
        public ?Integration $integration = null,
    ) {
    }
}
