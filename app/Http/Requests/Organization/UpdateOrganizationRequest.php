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
            'description' => ['nullable', 'string', 'max:1000'],
            'website_url' => ['nullable', 'string', 'url', 'max:255'],
            'logo_media_id' => ['nullable', 'integer', 'exists:medias,id'],
            'favicon_media_id' => ['nullable', 'integer', 'exists:medias,id'],
            'primary_color' => ['nullable', 'string', 'regex:/^#[0-9A-F]{6}$/i'],
            'social_media' => ['nullable', 'array'],
            'social_media.facebook' => ['nullable', 'url', 'max:255'],
            'social_media.twitter' => ['nullable', 'url', 'max:255'],
            'social_media.instagram' => ['nullable', 'url', 'max:255'],
            'social_media.linkedin' => ['nullable', 'url', 'max:255'],
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
