<?php

namespace App\Workflows\Automation;

use App\Workflows\Automation\Attributes\Activity;
use App\Workflows\Automation\Attributes\ActivityArgument;
use ReflectionClass;

class ActivitySchemaRegistry
{
    private static array $schemas = [];

    private static array $typeMap = [];

    public function register(string $activityClass, ?string $type = null): void
    {
        // If type is not explicitly provided, try to get it from class attribute
        if ($type === null) {
            $reflection = new ReflectionClass($activityClass);
            $attrs = $reflection->getAttributes(Activity::class);
            if (! empty($attrs)) {
                $attr = $attrs[0]->newInstance();
                $type = $attr->type;
            }
        }

        if ($type) {
            self::$typeMap[$type] = $activityClass;
        }
    }

    public static function getActivityClassForType(string $type): ?string
    {
        return self::$typeMap[$type] ?? null;
    }

    public static function getAllActivityTypes(): array
    {
        $result = [];

        foreach (self::$typeMap as $type => $class) {
            $reflection = new ReflectionClass($class);
            $attrs = $reflection->getAttributes(Activity::class);
            $meta = ! empty($attrs) ? $attrs[0]->newInstance() : null;

            $result[] = [
                'type' => $type,
                'name' => $meta?->name ?? class_basename($class),
                'description' => $meta?->description ?? '',
                'viewModes' => $meta?->viewModes ?? ['default'],
                'schema' => self::getSchema($class),
            ];
        }

        return $result;
    }

    public static function getSchema(string $activityClass): array
    {
        if (isset(self::$schemas[$activityClass])) {
            return self::$schemas[$activityClass];
        }

        $reflection = new ReflectionClass($activityClass);
        $attributes = $reflection->getAttributes(ActivityArgument::class);

        $schema = [];
        foreach ($attributes as $attribute) {
            $arg = $attribute->newInstance();

            // Get the section
            $section = $arg->section;

            // Initialize the section if it doesn't exist yet
            if (! isset($schema[$section])) {
                $schema[$section] = [];
            }

            // Process dot notation for nested properties
            $fieldPath = explode('.', $arg->name);

            $field = [
                'type' => $arg->type,
                'label' => $arg->label,
                'description' => $arg->description,
                'default' => $arg->default,
                'required' => $arg->required,
            ];

            // Add schema for nested objects
            if ($arg->schema) {
                $field['schema'] = $arg->schema;
            }

            // Add item type for arrays
            if ($arg->itemType) {
                $field['itemType'] = $arg->itemType;
            }

            // Add options for select/radio fields
            if ($arg->options) {
                $field['options'] = $arg->options;
            }

            // Add viewMode for conditionally visible fields
            if ($arg->viewMode && $arg->viewMode !== 'default') {
                $field['viewMode'] = $arg->viewMode;
            }

            // Handle different field path scenarios
            if (count($fieldPath) === 1) {
                // Simple field with no dots
                $schema[$section][$fieldPath[0]] = $field;
            } else {
                // For fields like "email.subject" where section is "email"
                if ($fieldPath[0] === $section) {
                    // Remove section from path to avoid duplication
                    array_shift($fieldPath);

                    // If there's only one path segment left after removing section
                    if (count($fieldPath) === 1) {
                        $schema[$section][$fieldPath[0]] = $field;
                    } else {
                        // Handle deeper nesting
                        self::setNestedValueInSection($schema[$section], $fieldPath, $field);
                    }
                } else {
                    // Standard dot notation where section doesn't match first segment
                    self::setNestedValueInSection($schema[$section], $fieldPath, $field);
                }
            }
        }

        self::$schemas[$activityClass] = $schema;

        return $schema;
    }

    private static function setNestedValueInSection(array &$section, array $path, $value): void
    {
        $key = array_shift($path);

        if (empty($path)) {
            $section[$key] = $value;

            return;
        }

        if (! isset($section[$key]) || ! is_array($section[$key])) {
            $section[$key] = [];
        }

        self::setNestedValueInSection($section[$key], $path, $value);
    }

    // Helper to get flattened arguments for validation
    public static function getFlattenedArguments(string $activityClass): array
    {
        $schema = self::getSchema($activityClass);
        $flattened = [];

        foreach ($schema as $section => $fields) {
            self::flattenFields($fields, $flattened);
        }

        return $flattened;
    }

    private static function flattenFields(array $fields, array &$result, string $prefix = ''): void
    {
        foreach ($fields as $name => $field) {
            $fullName = $prefix ? "$prefix.$name" : $name;

            if (isset($field['schema'])) {
                self::flattenFields($field['schema'], $result, $fullName);
            } else {
                $result[$fullName] = $field;
            }
        }
    }
}
