<?php

declare(strict_types=1);

namespace App\Http\Requests\Offer;

use App\Models\Store\Theme;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OfferThemeUpdateRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'theme_id' => [
                'required',
                'exists:store_themes,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'theme_id.required' => 'Please select a theme.',
            'theme_id.exists' => 'The selected theme does not exist.',
        ];
    }
}
