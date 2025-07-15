<?php

namespace App\Workflows\Automation;

use App\Models\Integration;
use App\Workflows\Attributes\Action;
use ReflectionClass;

abstract class AppAction
{
    protected Integration $integration;
    protected array $configuration;

    public function __construct(Integration $integration, array $configuration = [])
    {
        $this->integration = $integration;
        $this->configuration = $configuration;
    }

    /**
     * Get the action metadata from the Action attribute
     */
    public static function getMetadata(): array
    {
        $reflection = new ReflectionClass(static::class);
        $attributes = $reflection->getAttributes(Action::class);
        
        if (empty($attributes)) {
            throw new \Exception('AppAction must have an Action attribute');
        }
        
        $action = $attributes[0]->newInstance();
        
        return [
            'key' => $action->key,
            'noun' => $action->noun,
            'label' => $action->label,
            'description' => $action->description,
            'type' => $action->type,
        ];
    }

    /**
     * Get the action properties/schema
     */
    public static function getProps(): array
    {
        if (!method_exists(static::class, 'props')) {
            return [];
        }
        
        $props = static::props();
        $schema = [];
        
        foreach ($props as $field) {
            if ($field instanceof Field) {
                $schema[$field->getKey()] = $field->toArray();
            }
        }
        
        return $schema;
    }

    /**
     * Get the complete action definition for the frontend
     */
    public static function getDefinition(): array
    {
        $metadata = static::getMetadata();
        $props = static::getProps();
        
        return [
            'key' => $metadata['key'],
            'noun' => $metadata['noun'],
            'label' => $metadata['label'],
            'description' => $metadata['description'],
            'type' => $metadata['type'],
            'props' => $props,
            'class' => static::class,
        ];
    }

    /**
     * Execute the action with a Bundle object
     */
    abstract public function __invoke(Bundle $bundle): array;

    /**
     * Get sample output data for testing
     */
    public function sample(): array
    {
        return [];
    }
} 