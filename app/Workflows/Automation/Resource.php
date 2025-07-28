<?php

namespace App\Workflows\Automation;

use App\Models\Integration;
use App\Workflows\Attributes\IsResource as ResourceAttribute;
use ReflectionClass;

abstract class Resource
{
    protected Integration $integration;

    public function __construct(Integration $integration)
    {
        $this->integration = $integration;
    }

    /**
     * Get the resource metadata from the Resource attribute
     */
    public static function getMetadata(): array
    {
        $reflection = new ReflectionClass(static::class);
        $attributes = $reflection->getAttributes(ResourceAttribute::class);

        if (empty($attributes)) {
            throw new \Exception('Resource must have a Resource attribute');
        }

        $resource = $attributes[0]->newInstance();

        return [
            'key' => $resource->key,
            'noun' => $resource->noun,
            'label' => $resource->label,
            'description' => $resource->description,
        ];
    }

    /**
     * Get the complete resource definition for the frontend
     */
    public static function getDefinition(): array
    {
        $metadata = static::getMetadata();

        return [
            'key' => $metadata['key'],
            'noun' => $metadata['noun'],
            'label' => $metadata['label'],
            'description' => $metadata['description'],
            'class' => static::class,
        ];
    }

    /**
     * Search for resources with optional query parameters
     */
    abstract public function search(array $query = []): array;

    /**
     * Get a specific resource by ID
     */
    abstract public function get(string $id): ?array;

    /**
     * Get the value and label fields for the resource
     */
    abstract public function getValueLabelFields(): array;
}
