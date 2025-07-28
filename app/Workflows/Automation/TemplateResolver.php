<?php

namespace App\Workflows\Automation;

use App\Models\Automation\TriggerEvent;
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
        int $executionId,
        TriggerEvent $triggerEvent,
        array $additionalContext = []
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
    private static function buildWorkflowContext(int $executionId, TriggerEvent $triggerEvent, array $additionalContext = []): array
    {
        $cacheKey = "workflow_context_{$executionId}";

        $context = [
            'trigger' => $triggerEvent->event_data ?? [],
        ];

        // Get all completed workflow steps for this execution
        $completedSteps = WorkflowStep::query()
            ->where('execution_id', $executionId)
            ->where('status', WorkflowStep::STATUS_COMPLETED)
            ->orderBy('created_at', 'asc')
            ->get(['id', 'node_id', 'output_data', 'processed_output']);

        // Build step context with both node_id and step_id references
        foreach ($completedSteps as $step) {
            $stepData = $step->processed_output ?? $step->output_data ?? [];

            // Reference by node_id (e.g., action__1_key)
            $context["action__{$step->node_id}"] = $stepData;
        }

        // Merge additional context
        return array_merge($context, $additionalContext);
//        return Cache::remember($cacheKey, 300, function () use ($executionId, $triggerEvent, $additionalContext) {
//
//        });
    }

    /**
     * Resolve template variables in a value with enhanced Zapier-style support
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
            return self::resolveVariable($variable, $context);
        }, $value);
    }

    /**
     * Resolve a single variable with Zapier-style syntax support
     */
    private static function resolveVariable(string $variable, array $context): string
    {
        // Handle trigger__key syntax (trigger data)
        if (preg_match('/^trigger__(.+)$/', $variable, $matches)) {
            $key = $matches[1];
            return self::getNestedValue($context['trigger'] ?? [], $key) ?? '';
        }

        // Handle action__id_key syntax (previous action output)
        if (preg_match('/^action__(\d+)_(.+)$/', $variable, $matches)) {
            $actionId = $matches[1];
            $key = $matches[2];

            // Try to find the action data by ID
            $actionData = self::findActionData($actionId, $context);
            if ($actionData !== null) {
                return self::getNestedValue($actionData, $key) ?? '';
            }
        }

        // Handle step__id_key syntax (alternative to action__)
        if (preg_match('/^step__(\d+)_(.+)$/', $variable, $matches)) {
            $stepId = $matches[1];
            $key = $matches[2];

            $stepData = self::findStepData($stepId, $context);
            if ($stepData !== null) {
                return self::getNestedValue($stepData, $key) ?? '';
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

        // Try step_node_id
        if (isset($context["step_{$actionId}"])) {
            return $context["step_{$actionId}"];
        }

        return null;
    }

    /**
     * Find step data by ID
     */
    private static function findStepData(string $stepId, array $context): ?array
    {
        // Try step__step_id
        if (isset($context["step__{$stepId}"])) {
            return $context["step__{$stepId}"];
        }

        // Try action__step_id
        if (isset($context["action__{$stepId}"])) {
            return $context["action__{$stepId}"];
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

    /**
     * Clear workflow context cache
     */
    public static function clearWorkflowContext(int $executionId): void
    {
        Cache::forget("workflow_context_{$executionId}");
    }

    /**
     * Extract all template variables from a string or array
     */
    public static function extractTemplateVariables(string|array $template): array
    {
        $variables = [];

        if (is_array($template)) {
            foreach ($template as $value) {
                $variables = array_merge($variables, self::extractTemplateVariables($value));
            }
            return array_unique($variables);
        }

        if (!is_string($template) || !str_contains($template, '{{')) {
            return [];
        }

        preg_match_all('/{{\s*(.*?)\s*}}/', $template, $matches);
        return array_unique($matches[1] ?? []);
    }

    /**
     * Validate template variables against available context
     */
    public static function validateTemplateVariables(array $templateVariables, array $context): array
    {
        $invalid = [];
        $valid = [];

        foreach ($templateVariables as $variable) {
            $resolved = self::resolveVariable($variable, $context);
            if ($resolved === '') {
                $invalid[] = $variable;
            } else {
                $valid[] = $variable;
            }
        }

        return [
            'valid' => $valid,
            'invalid' => $invalid,
        ];
    }
}
