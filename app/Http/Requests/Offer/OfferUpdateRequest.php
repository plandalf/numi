<?php

declare(strict_types=1);

namespace App\Http\Requests\Offer;

use App\Http\Requests\CreateUpdateThemeRequest;
use Illuminate\Foundation\Http\FormRequest;

class OfferUpdateRequest extends FormRequest
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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        $baseRules = [
            'name' => ['string', 'max:255'],
            'view' => ['nullable', 'array'],
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
            'name.required' => 'The offer name is required.',
            'name.max' => 'The offer name cannot exceed 255 characters.',
            'image_url.url' => 'The image URL must be a valid URL.',
            'product_image_id.exists' => 'The selected product image does not exist.',
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