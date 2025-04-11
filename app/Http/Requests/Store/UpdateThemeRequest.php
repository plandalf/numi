<?php

namespace App\Http\Requests\Store;

use App\Enums\Theme\Element;
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
            if ($type === Element::OBJECT && isset($field['properties'])) {
                $nestedRules = $this->generateValidationRules($field['properties'], $fieldPath);
                $rules = array_merge($rules, $nestedRules);
            }
        }

        return $rules;
    }

    /**
     * Get validation rule based on the element type.
     *
     * @param Element $type
     * @return array
     */
    private function getValidationRuleForType(Element $type): array
    {
        return match ($type->value) {
            Element::OBJECT->value => ['array'],
            Element::COLOR->value => ['string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            Element::SIZE->value => ['string'],
            Element::FONT->value => ['string'],
            Element::WEIGHT->value => ['string'],
            Element::SHADOW->value => ['string'],
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
            'regex' => ':attribute must be a valid value',
        ];

        // Type-specific error messages
        $typeMessages = [
            Element::COLOR->value => [
                'regex' => ':attribute must be a valid hex color code (e.g., #FF0000 or #F00)',
            ],
            Element::SIZE->value => [
                'regex' => ':attribute must be a valid size (e.g., 1rem, 16px, 1.5em, 100%)',
            ],
            Element::WEIGHT->value => [
                'regex' => ':attribute must be a valid font weight (normal, bold, light, medium, or semibold)',
            ],
            Element::SHADOW->value => [
                'regex' => ':attribute must be a valid shadow value (e.g., 0 1px 2px rgba(0,0,0,0.1))',
            ],
        ];

        // Generate messages for all fields in the structure
        $this->generateValidationMessages(ThemeProperties::PROPERTY_STRUCTURE, $messages, $commonMessages, $typeMessages);

        return $messages;
    }

    /**
     * Generate validation messages based on the property structure.
     *
     * @param array $structure The property structure
     * @param array $messages The messages array to populate
     * @param array $commonMessages Common message templates
     * @param array $typeMessages Type-specific message templates
     * @param string $prefix The prefix for nested properties
     * @return void
     */
    private function generateValidationMessages(
        array $structure,
        array &$messages,
        array $commonMessages,
        array $typeMessages,
        string $prefix = ''
    ): void {
        foreach ($structure as $field) {
            $name = $field['name'];
            $type = $field['type'];
            $fieldPath = $prefix ? "{$prefix}.{$name}" : $name;
            $fieldName = $this->formatFieldName($name);

            // Add messages based on the type
            if ($type->value === Element::OBJECT->value) {
                $messages["{$fieldPath}.array"] = str_replace(':attribute', $fieldName, $commonMessages['array']);
                
                // Recursively process nested properties
                if (isset($field['properties'])) {
                    $this->generateValidationMessages($field['properties'], $messages, $commonMessages, $typeMessages, $fieldPath);
                }
            } else {
                $messages["{$fieldPath}.string"] = str_replace(':attribute', $fieldName, $commonMessages['string']);
                
                // Add type-specific messages if they exist
                if (isset($typeMessages[$type->value]['regex'])) {
                    $messages["{$fieldPath}.regex"] = str_replace(':attribute', $fieldName, $typeMessages[$type->value]['regex']);
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