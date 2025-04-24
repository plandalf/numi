<?php

namespace App\Http\Requests\Product;

use App\Models\Catalog\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProductStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User must be authenticated and have an organization context
        return Auth::check() && Auth::user()->currentOrganization;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $organizationId = Auth::user()->currentOrganization->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'lookup_key' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Product::class)->where(function ($query) use ($organizationId) {
                    return $query->where('organization_id', $organizationId);
                })
            ],
            'integration_id' => ['nullable', 'exists:integrations,id'],
            'gateway_prices' => ['required_with:integration_id', 'array'],
            'gateway_prices.*' => ['string', 'max:255'],
            'gateway_product_id' => ['required_with:integration_id', 'string', 'max:255'],

            // Add validation for other fields from migration if needed (e.g., gateway)
            'gateway_provider' => ['nullable', 'string', 'max:255'],
            'gateway_product_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
