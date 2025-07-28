<?php

namespace App\Workflows\Automation\Events;

use App\Models\Organization;

class SystemEvent implements AutomationTriggerEvent
{
    public function __construct(
        public string $type,
        public string $app,
        public Organization $organization,
        public array $props,
    )
    {
    }
}
