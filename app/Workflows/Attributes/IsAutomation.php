<?php

namespace App\Workflows\Attributes;

#[\Attribute(\Attribute::TARGET_CLASS)]
class IsAutomation
{
    public function __construct(
        public string $key,
        public string $name,
        public string $description,
        public string $version = '1.0.0',
        public ?string $provider_url = null,
    ) {
    }
}
