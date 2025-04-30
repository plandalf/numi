<?php

namespace App\Workflows\Automation\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
class Activity
{
    public function __construct(
        public string $type,
        public string $name,
        public string $description = '',
    ) {}
}
