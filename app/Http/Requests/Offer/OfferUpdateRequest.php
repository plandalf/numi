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
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'product_image_id' => ['nullable', 'integer', 'exists:medias,id'],
            'status' => ['in:draft,published,archived'],
            'theme_id' => ['nullable', 'exists:themes,id'],
            'checkout_success_url' => ['nullable', 'url', 'max:255'],
            'checkout_cancel_url' => ['nullable', 'url', 'max:255'],
            'is_hosted' => ['nullable', 'boolean'],
            'view' => ['nullable', 'array'],
            'hosted_page' => ['nullable', 'array'],
            'hosted_page.logo_image_id' => ['nullable', 'exists:medias,id'],
            'hosted_page.background_image_id' => ['nullable', 'exists:medias,id'],
            'hosted_page.style' => ['nullable', 'array'],
            'hosted_page.style.*' => ['nullable'],
            'hosted_page.appearance' => ['nullable', 'array'],
            'hosted_page.appearance.*' => ['nullable'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.max' => 'The offer name cannot exceed 255 characters.',
            'theme_id.exists' => 'The selected theme does not exist.',
            'image_url.url' => 'The image URL must be a valid URL.',
            'product_image_id.exists' => 'The selected product image does not exist.',
            'status.in' => 'Invalid status value.',
            'default_currency.max' => 'Currency code must be 3 characters.',
            'checkout_success_url.url' => 'The success URL must be a valid URL.',
            'checkout_cancel_url.url' => 'The cancel URL must be a valid URL.',
            'hosted_page.logo_image_id.exists' => 'The selected logo image does not exist.',
            'hosted_page.background_image_id.exists' => 'The selected background image does not exist.',
        ];
    }
}
