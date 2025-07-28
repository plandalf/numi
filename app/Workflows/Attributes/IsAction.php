<?php

namespace App\Workflows\Attributes;

#[\Attribute(\Attribute::TARGET_CLASS)]
class IsAction
{
    public function __construct(
        public string $key,
        public string $noun,
        public string $label,
        public string $description,
        public string $type = 'action', // or "search" or "create"
    ) {
    }
}
