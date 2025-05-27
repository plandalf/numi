<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateUpdateThemeRequest extends FormRequest
{

    protected $colorFields = [
        'primary_color',
        'primary_contrast_color',
        'secondary_color',
        'secondary_contrast_color',
        'canvas_color',
        'primary_surface_color',
        'secondary_surface_color',
        'label_text_color',
        'body_text_color',
        'primary_border_color',
        'secondary_border_color',
        'warning_color',
        'success_color',
        'highlight_color',
    ];

    protected $fontFields = ['main_font', 'mono_font'];

    protected $typographyArrays = [
        'h1_typography',
        'h2_typography',
        'h3_typography',
        'h4_typography',
        'h5_typography',
        'label_typography',
        'body_typography',
    ];

    protected $sizeFields = ['border_radius'];

    protected $spacingFields = ['padding', 'spacing', 'margin'];

    protected $shadowFields = ['shadow'];

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
        $rules = [
            'name' => ['string', 'nullable', 'max:255'],
            'theme_id' => ['string', 'exists:themes,id,organization_id,' . Auth::user()->current_organization_id],
        ];

        // Add color field rules
        foreach ($this->colorFields as $field) {
            $rules[$field] = ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/'];
        }

        // Add font field rules
        foreach ($this->fontFields as $field) {
            $rules[$field] = ['nullable', 'string', 'max:64'];
        }

        // Add typography array rules with key-specific validation
        foreach ($this->typographyArrays as $field) {
            $rules[$field] = ['nullable', 'array'];
            $rules["{$field}.font"] = ['nullable', 'string', 'max:64'];
            $rules["{$field}.color"] = ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/'];
            $rules["{$field}.letterSpacing"] = ['nullable', 'string'];
            $rules["{$field}.lineHeight"] = ['nullable', 'string'];
            $rules["{$field}.size"] = ['nullable', 'string'];
            $rules["{$field}.weight"] = ['nullable', 'string', 'max:3'];
        }

        // Add size fields rules
        foreach ($this->sizeFields as $field) {
            $rules[$field] = ['nullable', 'string', 'max:4'];
        }

        // Add spacing fields rules
        foreach ($this->spacingFields as $field) {
            $rules[$field] = ['nullable', 'string', 'max:32'];
        }

        // Add shadow field rules
        foreach ($this->shadowFields as $field) {
            $rules[$field] = ['nullable', 'string', 'max:64'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $messages = [
            // Basic string field messages
            'name.string' => 'The name must be a string.',
            'name.max' => 'The name cannot be longer than 255 characters.',
        ];

        // Add color field messages
        foreach ($this->colorFields as $field) {
            $fieldName = $this->getReadableFieldName($field);
            $messages["{$field}.regex"] = "The {$fieldName} must be a valid hex color (e.g., #FF0000 or #FF0000FF).";
        }

        // Add font field messages
        foreach ($this->fontFields as $field) {
            $fieldName = $this->getReadableFieldName($field);
            $messages["{$field}.max"] = "The {$fieldName} cannot be longer than 64 characters.";
        }

        // Add typography array messages
        foreach ($this->typographyArrays as $field) {
            $fieldName = $this->getReadableFieldName($field);

            $messages["{$field}.array"] = "The {$fieldName} must be an object.";

            $messages["{$field}.font.string"] = "The font in {$fieldName} must be a string.";
            $messages["{$field}.font.max"] = "The font in {$fieldName} cannot be longer than 64 characters.";

            $messages["{$field}.color.string"] = "The color in {$fieldName} must be a string.";
            $messages["{$field}.color.regex"] = "The color in {$fieldName} must be a valid hex color (e.g., #FF0000 or #FF0000FF).";

            $messages["{$field}.letterSpacing.string"] = "The letter spacing in {$fieldName} must be a string.";
            $messages["{$field}.lineHeight.string"] = "The line height in {$fieldName} must be a string.";
            $messages["{$field}.size.string"] = "The size in {$fieldName} must be a string.";

            $messages["{$field}.weight.string"] = "The weight in {$fieldName} must be a string.";
            $messages["{$field}.weight.max"] = "The weight in {$fieldName} cannot be longer than 3 characters.";
        }

        // Add size field messages
        foreach ($this->sizeFields as $field) {
            $fieldName = $this->getReadableFieldName($field);
            $messages["{$field}.max"] = "The {$fieldName} cannot be longer than 4 characters.";
        }

        // Add spacing field messages
        foreach ($this->spacingFields as $field) {
            $fieldName = $this->getReadableFieldName($field);
            $messages["{$field}.max"] = "The {$fieldName} cannot be longer than 32 characters.";
        }

        // Add shadow field messages
        foreach ($this->shadowFields as $field) {
            $fieldName = $this->getReadableFieldName($field);
            $messages["{$field}.max"] = "The {$fieldName} cannot be longer than 64 characters.";
        }

        return $messages;
    }

    private function getReadableFieldName(string $field): string
    {
        return ucwords(str_replace('_', ' ', $field));
    }
}
