<?php

declare(strict_types=1);

namespace App\Http\Requests\Price;

use App\Enums\ChargeType;
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
                    return $query->where('organization_id', $organizationId);
                })->ignore($price->id),
            ],
            // Immutable fields: scope, type, currency? Typically shouldn't change after creation.
            // 'scope' => [...]
            // 'type' => [...]
            // 'currency' => [...]

            'amount' => ['sometimes', 'required', 'integer', 'min:0'],
            'parent_list_price_id' => [
                'sometimes',
                new RequiredIf(in_array($this->input('scope', $price->scope), ['custom', 'variant'])),
                'nullable',
                'integer',
                Rule::exists('catalog_prices', 'id')->where(function ($query) use ($product) {
                    return $query->where('product_id', $product->id)
                        ->where('scope', 'list');
                }),
                // Custom validation to ensure type matches parent
                function ($attribute, $value, $fail) use ($price) {
                    if ($value && in_array($this->input('scope', $price->scope), ['custom', 'variant'])) {
                        $parentPrice = \App\Models\Catalog\Price::find($value);
                        if ($parentPrice && $this->input('type', $price->type) !== $parentPrice->type) {
                            $fail("The selected type must match the parent price type ({$parentPrice->type}).");
                        }
                    }
                },
            ],
            'renew_interval' => [
                'sometimes',
                new RequiredIf(in_array($this->input('type', $price->type), ['recurring', 'tiered', 'volume', 'graduated', 'package'])),
                'nullable',
                Rule::in(['day', 'week', 'month', 'year']),
            ],
            'billing_anchor' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'recurring_interval_count' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
            ],
            'cancel_after_cycles' => ['sometimes', 'nullable', 'integer'],
            'properties' => ['sometimes', 'nullable', 'array'],
            'properties.tiers' => ['sometimes', 'array'],
            'properties.tiers.*.from' => ['sometimes', 'integer', 'min:0'],
            'properties.tiers.*.to' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'properties.tiers.*.unit_amount' => ['sometimes', 'integer', 'min:0'],
            'properties.package' => ['sometimes', 'array'],
            'properties.package.size' => ['sometimes', 'integer', 'min:1'],
            'properties.package.unit_amount' => ['sometimes', 'integer', 'min:0'],
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
        if ($this->input('type', $price->type) === ChargeType::ONE_TIME->value) {
            $this->merge([
                'renew_interval' => null,
                'recurring_interval_count' => null,
                'billing_anchor' => null,
            ]);
        }

        // Validate and prepare properties for complex pricing models
        $price = $this->route('price');
        $type = $this->input('type', $price->type);
        if (in_array($type, ['tiered', 'volume', 'graduated', 'package'])) {
            $properties = $this->input('properties');
            
            // For tier-based pricing (tiered, volume, graduated)
            if (in_array($type, ['tiered', 'volume', 'graduated']) && $properties) {
                if (isset($properties['tiers']) && is_array($properties['tiers'])) {
                    // Validate tiers structure
                    $validTiers = array_filter($properties['tiers'], function ($tier) {
                        return is_array($tier) && 
                               isset($tier['from']) && is_numeric($tier['from']) &&
                               isset($tier['unit_amount']) && is_numeric($tier['unit_amount']);
                    });
                    
                    if (!empty($validTiers)) {
                        $this->merge(['properties' => ['tiers' => array_values($validTiers)]]);
                    } else {
                        $this->merge(['properties' => null]);
                    }
                }
            }
            
            // For package pricing
            if ($type === 'package' && $properties) {
                if (isset($properties['package']) && is_array($properties['package'])) {
                    $package = $properties['package'];
                    if (isset($package['size'], $package['unit_amount']) && 
                        is_numeric($package['size']) && is_numeric($package['unit_amount'])) {
                        $this->merge(['properties' => ['package' => $package]]);
                    } else {
                        $this->merge(['properties' => null]);
                    }
                }
            }
        }
    }
}
