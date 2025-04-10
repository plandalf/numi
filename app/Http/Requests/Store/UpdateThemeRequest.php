<?php

namespace App\Http\Requests\Store;

use App\Enums\Theme\ElementType;
use App\Models\Store\ThemeProperties;
use Illuminate\Foundation\Http\FormRequest;

class UpdateThemeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['string', 'nullable', 'max:255'],
            ...$this->generateValidationRules(ThemeProperties::PROPERTY_STRUCTURE)
        ];
    }

    /**
     * Generate validation rules based on the property structure.
     *
     * @param array $structure The property structure
     * @param string $prefix The prefix for nested properties
     * @return array<string, mixed>
     */
    private function generateValidationRules(array $structure, string $prefix = ''): array
    {
        $rules = [];

        foreach ($structure as $field) {
            $name = $field['name'];
            $type = $field['type'];
            $fieldPath = $prefix ? "{$prefix}.{$name}" : $name;

            // Add validation rule based on the type
            $rules[$fieldPath] = $this->getValidationRuleForType($type);

            // If it's an object type, recursively process its properties
            if ($type === ElementType::OBJECT && isset($field['properties'])) {
                $nestedRules = $this->generateValidationRules($field['properties'], $fieldPath);
                $rules = array_merge($rules, $nestedRules);
            }
        }

        return $rules;
    }

    /**
     * Get validation rule based on the element type.
     *
     * @param ElementType $type
     * @return array
     */
    private function getValidationRuleForType(ElementType $type): array
    {
        return match ($type->value) {
            ElementType::OBJECT->value => ['array'],
            ElementType::COLOR->value => ['string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            ElementType::SIZE->value => ['string'],
            ElementType::FONT->value => ['string'],
            ElementType::WEIGHT->value => ['string'],
            ElementType::SHADOW->value => ['string'],
            default => ['string'],
        };
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $messages = [];

        // Common error messages
        $commonMessages = [
            'array' => ':attribute must be properly structured',
            'string' => ':attribute must be a valid value',
            'regex' => ':attribute must be a valid hex color code',
        ];

        // Generate messages for all fields in the structure
        $this->generateValidationMessages(ThemeProperties::PROPERTY_STRUCTURE, $messages, $commonMessages);

        return $messages;
    }

    /**
     * Generate validation messages based on the property structure.
     *
     * @param array $structure The property structure
     * @param array $messages The messages array to populate
     * @param array $commonMessages Common message templates
     * @param string $prefix The prefix for nested properties
     * @return void
     */
    private function generateValidationMessages(array $structure, array &$messages, array $commonMessages, string $prefix = ''): void
    {
        foreach ($structure as $field) {
            $name = $field['name'];
            $type = $field['type'];
            $fieldPath = $prefix ? "{$prefix}.{$name}" : $name;
            $fieldName = $this->formatFieldName($name);

            // Add messages based on the type
            if ($type->value === ElementType::OBJECT->value) {
                $messages["{$fieldPath}.array"] = str_replace(':attribute', $fieldName, $commonMessages['array']);
                
                // Recursively process nested properties
                if (isset($field['properties'])) {
                    $this->generateValidationMessages($field['properties'], $messages, $commonMessages, $fieldPath);
                }
            } else {
                $messages["{$fieldPath}.string"] = str_replace(':attribute', $fieldName, $commonMessages['string']);
                
                if ($type->value === ElementType::COLOR->value) {
                    $messages["{$fieldPath}.regex"] = str_replace(':attribute', $fieldName, $commonMessages['regex']);
                }
            }
        }
    }

    /**
     * Format a field name for display in error messages.
     *
     * @param string $field
     * @return string
     */
    private function formatFieldName(string $field): string
    {
        return ucwords(str_replace('_', ' ', $field));
    }
} 