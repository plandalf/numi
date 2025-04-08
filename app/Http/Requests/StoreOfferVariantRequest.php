<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOfferVariantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Assuming any authenticated user can create a variant for now.
        // Replace with specific authorization logic if needed.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'product_id' => ['required', 'integer', 'exists:products,id'], // Ensure product exists
            'price_ids' => ['required', 'array', 'min:1'], // Must select at least one price
            'price_ids.*' => ['required', 'integer', 'exists:prices,id'], // Ensure each price ID exists
            'media_id' => ['nullable', 'integer', 'exists:media,id'], // Ensure media exists if provided
            // Removed: type, pricing_model, amount, currency, properties
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
            'product_id.required' => 'Please select a base product.',
            'product_id.exists' => 'The selected base product is invalid.',
            'price_ids.required' => 'Please select at least one price for this variant.',
            'price_ids.array' => 'Invalid price selection format.',
            'price_ids.min' => 'Please select at least one price for this variant.',
            'price_ids.*.exists' => 'One or more selected prices are invalid.',
            'media_id.exists' => 'The selected image is invalid.',
        ];
    }
}
