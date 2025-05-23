<?php

declare(strict_types=1);

namespace App\Http\Requests\Price;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\RequiredIf;

class UpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Ensure user can update the parent product and the specific price
        $product = $this->route('product');
        $price = $this->route('price');

        // Check if product and price belong to the current org
        return Auth::user()->currentOrganization->id === $product->organization_id &&
               $product->id === $price->product_id;
        // Optional: Add policy checks
        // return $this->user()->can('update', $product) && $this->user()->can('update', $price);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $product = $this->route('product');
        $price = $this->route('price');
        $organizationId = Auth::user()->currentOrganization->id;

        // Rules are similar to store, but some fields might be immutable (e.g., pricing_model, currency, scope?)
        // Adjust rules based on what should be updatable.
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'], // `sometimes` allows it to be absent
            'lookup_key' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('catalog_prices')->where(function ($query) use ($organizationId, $product) {
                    return $query->where('organization_id', $organizationId)
                        ->where('product_id', $product->id);
                })->ignore($price->id),
            ],
            // Immutable fields: scope, type, currency? Typically shouldn't change after creation.
            // 'scope' => [...]
            // 'type' => [...]
            // 'currency' => [...]

            'amount' => ['sometimes', 'required', 'integer', 'min:0'],
            'parent_list_price_id' => [
                'sometimes',
                new RequiredIf($this->input('scope', $price->scope) === 'custom'),
                'nullable',
                'integer',
                Rule::exists('catalog_prices', 'id')->where(function ($query) use ($product) {
                    return $query->where('product_id', $product->id)
                        ->where('scope', 'list');
                }),
            ],
            'renew_interval' => [
                'sometimes',
                new RequiredIf($this->input('type', $price->type) === 'recurring'),
                'nullable',
                Rule::in(['day', 'week', 'month', 'year']),
            ],
            'billing_anchor' => [
                'sometimes',
                new RequiredIf($this->input('type', $price->type) === 'recurring'),
                'nullable',
                'string',
                'max:255',
            ],
            'recurring_interval_count' => [
                'sometimes',
                new RequiredIf($this->input('type', $price->type) === 'recurring'),
                'nullable',
                'integer',
                'min:1',
            ],
            'cancel_after_cycles' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'properties' => ['sometimes', 'nullable', 'array'],
            // Add tiered/package properties validation if applicable
            'gateway_provider' => ['sometimes', 'nullable', 'string', 'max:255'],
            'gateway_price_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
            // 'archived_at' => ['sometimes', 'nullable', 'date'], // For archiving
        ];
    }

    protected function prepareForValidation()
    {
        $price = $this->route('price');

        // If scope is list, ensure parent_list_price_id is null
        if ($this->input('scope', $price->scope) === 'list') {
            $this->merge(['parent_list_price_id' => null]);
        }

        // Ensure recurring fields are null if not recurring model
        if ($this->input('type', $price->type) !== 'recurring') {
            $this->merge([
                'renew_interval' => null,
                'recurring_interval_count' => null,
                'billing_anchor' => null,
            ]);
        }
        // TODO: Add logic similar to VariantForm for properties based on pricing_model
    }
}
