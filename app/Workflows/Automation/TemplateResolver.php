<?php

namespace App\Workflows\Automation;

use App\Models\ResourceEvent;

class TemplateResolver
{
    public static function get(ResourceEvent $event, string|array $key = null, mixed $default = null): mixed
    {
        $context = ['trigger' => $event->snapshot];

        $resolve = function ($value) use ($context, &$resolve) {
            if (is_array($value)) {
                return array_map($resolve, $value);
            }

            if (!is_string($value) || !str_contains($value, '{{')) {
                return $value;
            }

            return preg_replace_callback('/{{\s*(.*?)\s*}}/', function ($matches) use ($context) {
                return data_get($context, $matches[1], '');
            }, $value);
        };

        return $resolve($key) ?? $default;
    }
}
