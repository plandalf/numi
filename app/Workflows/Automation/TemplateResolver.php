<?php

namespace App\Workflows\Automation;

use App\Models\ResourceEvent;

class TemplateResolver
{
    /**
     * Legacy method for backward compatibility
     */
    public static function get(ResourceEvent $event, string|array|null $key = null, mixed $default = null): mixed
    {
        $context = ['trigger' => $event->snapshot];
        return self::resolveValue($key, $context) ?? $default;
    }
    
    /**
     * New method for resolving templates with flexible context
     */
    public static function resolve(string|array|null $template, array $context): mixed
    {
        return self::resolveValue($template, $context);
    }
    
    /**
     * Resolve template variables in a value
     */
    private static function resolveValue($value, array $context): mixed
    {
        if (is_array($value)) {
            return array_map(fn($item) => self::resolveValue($item, $context), $value);
        }

        if (!is_string($value) || !str_contains($value, '{{')) {
            return $value;
        }

        return preg_replace_callback('/{{\s*(.*?)\s*}}/', function ($matches) use ($context) {
            $variable = trim($matches[1]);
            
            // Support dot notation: trigger.member_name, step_1.field_name
            $resolved = data_get($context, $variable, '');
            
            // If not found, try without prefix for backward compatibility
            if (empty($resolved) && str_contains($variable, '.')) {
                $parts = explode('.', $variable);
                $resolved = data_get($context, end($parts), '');
            }
            
            return $resolved;
        }, $value);
    }
}
