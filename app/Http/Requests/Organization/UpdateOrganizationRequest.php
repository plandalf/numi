<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->organizations->contains($this->route('organization')->id);
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
            'default_currency' => [
                Rule::in(['USD', 'GBP', 'AUD', 'NZD', 'JPY', 'EUR'])
            ],
            'checkout_success_url' => [
                'nullable',
                'string',
                'url',
            ],
            'checkout_cancel_url' => [
                'nullable',
                'string',
                'url',
            ],
            'subdomain' => [
                'string',
                'min:5',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('organizations')->ignore($this->route('organization')->id),
                function ($attribute, $value, $fail) {
                    $restrictedSubdomains = config('restricted-subdomains');
                    if (in_array($value, $restrictedSubdomains)) {
                        $fail('The subdomain is restricted and cannot be used.');
                    }
                },
            ],
        ];
    }
}
