<?php

namespace App\Services;

class DataSchemaService
{
    /**
     * Analyze data and generate a JSON Schema
     */
    public function analyzeData($data): array
    {
        if (is_null($data)) {
            return ['type' => 'null'];
        }

        if (is_bool($data)) {
            return ['type' => 'boolean'];
        }

        if (is_int($data)) {
            return ['type' => 'integer'];
        }

        if (is_float($data)) {
            return ['type' => 'number'];
        }

        if (is_string($data)) {
            return ['type' => 'string'];
        }

        if (is_array($data)) {
            // Check if it's an associative array (object) or numeric array (list)
            if ($this->isAssociativeArray($data)) {
                return [
                    'type' => 'object',
                    'properties' => $this->analyzeObjectProperties($data)
                ];
            } else {
                // For numeric arrays, analyze items to determine array schema
                $itemSchemas = [];
                $maxSamples = min(3, count($data)); // Sample first 3 items
                
                for ($i = 0; $i < $maxSamples; $i++) {
                    if (isset($data[$i])) {
                        $itemSchemas[] = $this->analyzeData($data[$i]);
                    }
                }

                // If all items have the same type, use that type
                if (count($itemSchemas) > 0) {
                    $firstType = $itemSchemas[0];
                    $allSameType = true;
                    
                    foreach ($itemSchemas as $schema) {
                        if ($schema['type'] !== $firstType['type']) {
                            $allSameType = false;
                            break;
                        }
                    }

                    if ($allSameType) {
                        return [
                            'type' => 'array',
                            'items' => $firstType
                        ];
                    }
                }

                // Mixed types or empty array
                return [
                    'type' => 'array',
                    'items' => ['type' => 'string'] // Default to string for mixed types
                ];
            }
        }

        // For objects, convert to array and analyze
        if (is_object($data)) {
            return $this->analyzeData((array) $data);
        }

        return ['type' => 'string']; // Default to string for unknown types
    }

    /**
     * Analyze properties of an object/associative array for JSON Schema
     */
    private function analyzeObjectProperties(array $data): array
    {
        $properties = [];
        
        foreach ($data as $key => $value) {
            $properties[$key] = $this->analyzeData($value);
        }

        return $properties;
    }

    /**
     * Check if array is associative (has string keys or non-sequential numeric keys)
     */
    private function isAssociativeArray(array $data): bool
    {
        if (empty($data)) {
            return false;
        }

        $keys = array_keys($data);
        
        // If any key is not numeric, it's associative
        foreach ($keys as $key) {
            if (!is_numeric($key)) {
                return true;
            }
        }

        // If keys are not sequential starting from 0, it's associative
        return $keys !== range(0, count($data) - 1);
    }

    /**
     * Update sequence schema with new node data
     */
    public function updateSequenceSchema(\App\Models\Automation\Sequence $sequence, int $nodeId, array $testResult): void
    {
        $currentSchema = $sequence->node_schema ?? [];
        
        // Initialize actions if not exists
        if (!isset($currentSchema['actions'])) {
            $currentSchema['actions'] = [];
        }

        // Analyze the test result and store schema for this node
        $currentSchema['actions'][(string) $nodeId] = $this->analyzeData($testResult);

        // Update the sequence
        $sequence->update(['node_schema' => $currentSchema]);
    }

    /**
     * Get schema for a specific node
     */
    public function getNodeSchema(\App\Models\Automation\Sequence $sequence, int $nodeId): ?array
    {
        $schema = $sequence->node_schema ?? [];
        return $schema['actions'][(string) $nodeId] ?? null;
    }

    /**
     * Get all available fields from sequence schema for mapping
     */
    public function getAvailableFields(\App\Models\Automation\Sequence $sequence): array
    {
        $schema = $sequence->node_schema ?? [];
        $fields = [];

        // Extract all available fields from actions
        if (isset($schema['actions'])) {
            foreach ($schema['actions'] as $nodeId => $nodeSchema) {
                $fields["action_{$nodeId}"] = $this->flattenSchemaForMapping($nodeSchema, "Action {$nodeId}");
            }
        }

        // Extract all available fields from triggers
        if (isset($schema['triggers'])) {
            foreach ($schema['triggers'] as $triggerId => $triggerSchema) {
                $fields["trigger_{$triggerId}"] = $this->flattenSchemaForMapping($triggerSchema, "Trigger {$triggerId}");
            }
        }

        return $fields;
    }

    /**
     * Flatten JSON Schema into a list of available fields for mapping UI
     */
    public function flattenSchemaForMapping(array $schema, string $prefix = '', string $path = ''): array
    {
        $fields = [];

        if ($schema['type'] === 'object' && isset($schema['properties'])) {
            foreach ($schema['properties'] as $key => $childSchema) {
                $newPath = $path ? "{$path}.{$key}" : $key;
                $newPrefix = $prefix ? "{$prefix} → {$key}" : $key;
                
                if ($childSchema['type'] === 'object') {
                    // Recursively flatten nested objects
                    $fields = array_merge($fields, $this->flattenSchemaForMapping($childSchema, $newPrefix, $newPath));
                } else {
                    $fields[$newPath] = [
                        'label' => $newPrefix,
                        'type' => $childSchema['type'],
                        'path' => $newPath,
                        'schema' => $childSchema // Include full schema for advanced use
                    ];
                }
            }
        } else {
            // For non-object types, add the root field
            $fields[$path ?: 'value'] = [
                'label' => $prefix ?: 'Value',
                'type' => $schema['type'],
                'path' => $path ?: 'value',
                'schema' => $schema
            ];
        }

        return $fields;
    }

    /**
     * Generate a complete JSON Schema document for test result
     */
    public function generateJsonSchema(array $testResult, string $title = 'Action Test Result'): array
    {
        return [
            '$schema' => 'https://json-schema.org/draft/2020-12/schema',
            '$id' => 'https://plandalf.com/schemas/action-result',
            'title' => $title,
            'description' => 'Schema for action test result data',
            ...$this->analyzeData($testResult)
        ];
    }

    /**
     * Validate data against a JSON Schema
     */
    public function validateAgainstSchema(array $data, array $schema): array
    {
        // This is a simple validation - for production you might want to use a proper JSON Schema validator
        $errors = [];
        
        if (isset($schema['type'])) {
            $expectedType = $schema['type'];
            $actualType = $this->getJsonSchemaType($data);
            
            if ($expectedType !== $actualType) {
                $errors[] = "Expected type {$expectedType}, got {$actualType}";
            }
        }

        return $errors;
    }

    /**
     * Get JSON Schema type for a value
     */
    private function getJsonSchemaType($value): string
    {
        if (is_null($value)) return 'null';
        if (is_bool($value)) return 'boolean';
        if (is_int($value)) return 'integer';
        if (is_float($value)) return 'number';
        if (is_string($value)) return 'string';
        if (is_array($value)) {
            return $this->isAssociativeArray($value) ? 'object' : 'array';
        }
        return 'string'; // Default
    }

    /**
     * Extract example value from schema for documentation
     */
    public function extractExampleFromSchema(array $schema): mixed
    {
        if (isset($schema['example'])) {
            return $schema['example'];
        }

        return match($schema['type'] ?? 'string') {
            'null' => null,
            'boolean' => true,
            'integer' => 42,
            'number' => 3.14,
            'string' => 'example',
            'array' => [],
            'object' => new \stdClass(),
            default => 'example'
        };
    }
} 