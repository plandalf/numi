<?php

namespace App\Workflows\Attributes;

#[\Attribute(\Attribute::TARGET_CLASS)]
class IsTrigger
{
    public function __construct(
        public string $key,
        public string $noun,
        public string $label,
        public string $description
    ) {
    }
}
