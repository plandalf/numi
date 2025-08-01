<?php

namespace App\Workflows\Automation;

use App\Models\Integration;
use App\Workflows\Attributes\IsTrigger;
use ReflectionClass;

abstract class AppTrigger
{
    protected Integration $integration;
    protected array $configuration;

    public function __construct(
//        public Integration $integration,
//        array $configuration = []
    ) {
//        $this->integration = $integration;
//        $this->configuration = $configuration;
    }

    /**
     * Get the trigger metadata from the Trigger attribute
     */
    public static function getMetadata(): array
    {
        $reflection = new ReflectionClass(static::class);
        $attributes = $reflection->getAttributes(IsTrigger::class);

        if (empty($attributes)) {
            throw new \Exception('AppTrigger must have a Trigger attribute');
        }

        $trigger = $attributes[0]->newInstance();

        return [
            'key' => $trigger->key,
            'noun' => $trigger->noun,
            'label' => $trigger->label,
            'description' => $trigger->description,
        ];
    }

    /**
     * Get the trigger properties/schema
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
     * Get the complete trigger definition for the frontend
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
            'props' => $props,
            'class' => static::class,
        ];
    }

    /**
     * Execute the trigger with a Bundle object
     */
    abstract public function __invoke(Bundle $bundle): array;

    /**
     * Subscribe to the trigger (for webhooks, etc.)
     */
    public function subscribe(Bundle $bundle): void
    {
        // Override in subclasses if needed
    }

    /**
     * Unsubscribe from the trigger
     */
    public function unsubscribe(Bundle $bundle): void
    {
        // Override in subclasses if needed
    }

    /**
     * Provide example data for testing when no real trigger events exist
     * Subclasses can override this to provide realistic example data
     */
    public function example(Bundle $bundle): array
    {
        return [
            'example' => true,
            'message' => 'This is example data for testing purposes',
            'timestamp' => now()->toISOString(),
        ];
    }
}
