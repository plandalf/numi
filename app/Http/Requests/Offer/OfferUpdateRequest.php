<?php

declare(strict_types=1);

namespace App\Http\Requests\Offer;

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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'url'],
            'properties' => ['nullable', 'array'],
            'view' => ['nullable', 'array'],
            'product_image_id' => ['nullable', 'exists:product_images,id'],
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
            'name.required' => 'The offer name is required.',
            'name.max' => 'The offer name cannot exceed 255 characters.',
            'image_url.url' => 'The image URL must be a valid URL.',
            'product_image_id.exists' => 'The selected product image does not exist.',
        ];
    }
} 