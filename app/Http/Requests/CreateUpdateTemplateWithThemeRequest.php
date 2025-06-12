<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Http\Requests\CreateUpdateThemeRequest;
use Illuminate\Foundation\Http\FormRequest;

class CreateUpdateTemplateWithThemeRequest extends FormRequest
{
    /**
     * We're encoding view field to preserve the actual contents like
     * the empty strings & strings with spaces as it is needed for the editor.
     * We could be using the array request type but the empty strings are getting
     * cleaned up by our global middleware `ConvertEmptyStringsToNull`.
     */
    public function prepareForValidation()
    {
        if ($this->view) {
            $this->merge([
                'view' => json_decode($this->view, true),
            ]);
        }
    }

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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        $baseRules = [
            'name' => ['string', 'max:255'],
            'category' => ['string', 'max:255'],
            'view' => ['nullable', 'array'],
            'preview_images' => ['nullable', 'array'],
        ];

        // Only include theme validation if theme data is present
        if ($this->has('theme')) {
            // Get theme validation rules from CreateUpdateThemeRequest
            $themeRequest = new CreateUpdateThemeRequest();
            $themeRules = $themeRequest->rules();

            // Add theme rules with 'theme.' prefix
            $themeRules = array_combine(
                array_map(fn($key) => "theme.{$key}", array_keys($themeRules)),
                array_values($themeRules)
            );

            return array_merge($baseRules, $themeRules);
        }

        return $baseRules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $baseMessages = [
            'name.required' => 'The template name is required.',
            'name.max' => 'The template name cannot exceed 255 characters.',
            'category.required' => 'The template category is required.',
            'category.max' => 'The template category cannot exceed 255 characters.',
        ];

        // Only include theme messages if theme data is present
        if ($this->has('theme')) {
            // Get theme validation messages from CreateUpdateThemeRequest
            $themeRequest = new CreateUpdateThemeRequest();
            $themeMessages = $themeRequest->messages();

            // Add theme messages with 'theme.' prefix
            $themeMessages = array_combine(
                array_map(fn($key) => "theme.{$key}", array_keys($themeMessages)),
                array_values($themeMessages)
            );

            return array_merge($baseMessages, $themeMessages);
        }

        return $baseMessages;
    }
} 