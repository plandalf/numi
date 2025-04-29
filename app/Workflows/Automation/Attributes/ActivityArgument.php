<?php

namespace App\Workflows\Automation\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class ActivityArgument
{
    public function __construct(
        public string $name,
        public string $type = 'string',
        public ?string $label = null,
        public ?string $description = null,
        public mixed $default = null,
        public bool $required = true,
        public ?string $section = null,
        public ?array $schema = null,
        public ?string $itemType = null,
        public ?array $options = null,
        public ?string $viewMode = 'default'
    ) {
        // Auto-generate section from dot notation if not provided
        if ($this->section === null && str_contains($name, '.')) {
            $this->section = explode('.', $name)[0];
        }
        
        // Default to general section if not specified or derived
        if ($this->section === null) {
            $this->section = 'general';
        }
        
        // Generate label from name if not provided
        if ($this->label === null) {
            $fieldName = str_contains($name, '.') 
                ? last(explode('.', $name)) 
                : $name;
            $this->label = ucfirst(str_replace('_', ' ', $fieldName));
        }
    }
} 