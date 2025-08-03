<?php

namespace App\Workflows\Automation;

use App\Models\Automation\AutomationEvent;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\Cache;

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
     * Resolve templates in workflow execution context with optimized lookups
     */
    public static function resolveForWorkflow(
        string|array|null $template,
        int               $executionId,
        AutomationEvent   $triggerEvent,
        array             $additionalContext = []
    ): mixed {

        $context = self::buildWorkflowContext($executionId, $triggerEvent, $additionalContext);

        // template = ["type" => "{{trigger__event_type}}"]
        // context = ["trigger" => array:4 [▼
        //    "offer_id" => 7
        //    "order_id" => 50
        //    "event_type" => "order_created"
        //    "triggered_at" => "2025-07-28T19:30:06.605302Z"
        //  ]
        // ]

        $resolved = self::resolveValue($template, $context);

        return $resolved;
    }

    /**
     * Build comprehensive context for workflow template resolution
     */
    private static function buildWorkflowContext(int $executionId, AutomationEvent $triggerEvent, array $additionalContext = []): array
    {

        $context = [
            'trigger' => $triggerEvent->event_data ?? [],
        ];

        // Get all completed workflow steps for this execution
        $completedSteps = WorkflowStep::query()
            ->where('run_id', $executionId)
            ->where('status', WorkflowStep::STATUS_COMPLETED)
            ->orderBy('created_at', 'asc')
            ->get(['id', 'action_id', 'output_data', 'processed_output']);

        // Build step context with both node_id and step_id references
        foreach ($completedSteps as $step) {
            $stepData = $step->processed_output ?? $step->output_data ?? [];

            // Reference by node_id (e.g., action__1_key)
            $context["action__{$step->action_id}"] = $stepData;
        }

        // Merge additional context
        return array_merge($context, $additionalContext);
    }

    /**
     * Resolve template variables in a value with enhanced Zapier-style support
     */
    public static function resolveValue($value, array $context): mixed
    {
        if (is_array($value)) {
            return array_map(fn($item) => self::resolveValue($item, $context), $value);
        }

        if (!is_string($value) || !str_contains($value, '{{')) {
            return $value;
        }

        return preg_replace_callback('/{{\s*(.*?)\s*}}/', function ($matches) use ($context) {
            $variable = trim($matches[1]);
            return self::resolveVariable($variable, $context);
        }, $value);
    }

    /**
     * Resolve a single variable with Zapier-style syntax support
     */
    private static function resolveVariable(string $variable, array $context): string
    {
        // Handle trigger__key syntax (trigger data)
        if (preg_match('/^trigger.(.+)$/', $variable, $matches)) {
            $key = $matches[1];
            return self::getNestedValue($context['trigger'] ?? [], $key) ?? '';
        }

        // Handle action__id_key syntax (previous action output)
        if (preg_match('/^action_(\d+).([\w.]+)$/', $variable, $matches)) {

            $actionId = $matches[1];
            $keyPath = str_replace('_', '.', $matches[2]); // Convert to dot notation

            $actionData = self::findActionData($actionId, $context);

            if ($actionData !== null) {
                return data_get($actionData, $keyPath)
                    ?? data_get($actionData, $matches[2]);
            }
        }

        // Handle direct dot notation (backward compatibility)
        if (str_contains($variable, '.')) {
            return data_get($context, $variable, '');
        }

        // Handle direct variable access
        return $context[$variable] ?? '';
    }

    /**
     * Find action data by ID (supports both node_id and step_id)
     */
    private static function findActionData(string $actionId, array $context): ?array
    {
        // Try action__node_id first
        if (isset($context["action__{$actionId}"])) {
            return $context["action__{$actionId}"];
        }

        // Try step__node_id
        if (isset($context["step__{$actionId}"])) {
            return $context["step__{$actionId}"];
        }

        return null;
    }

    /**
     * Get nested value from array using dot notation with underscore support
     */
    private static function getNestedValue(array $data, string $key): mixed
    {
        // Handle underscore-separated keys (e.g., first_name -> first_name)
        if (str_contains($key, '_')) {
            // Try the key as-is first
            $value = data_get($data, $key);
            if ($value !== null) {
                return $value;
            }

            // Try converting underscores to dots
            $dotKey = str_replace('_', '.', $key);
            $value = data_get($data, $dotKey);
            if ($value !== null) {
                return $value;
            }
        }

        // Handle dot notation
        if (str_contains($key, '.')) {
            return data_get($data, $key);
        }

        // Direct key access
        return $data[$key] ?? null;
    }
}
