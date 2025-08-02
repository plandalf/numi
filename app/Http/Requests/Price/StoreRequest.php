<?php

declare(strict_types=1);

namespace App\Http\Requests\Price;

use App\Enums\ChargeType;
use App\Enums\RenewInterval;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\RequiredIf;

class StoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $product = $this->route('product');

        return Auth::user()->currentOrganization->id === $product->organization_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $product = $this->route('product');
        $organizationId = Auth::user()->currentOrganization->id;

        return [
            'name' => ['string', 'max:255'],
            'lookup_key' => [
                'string',
                'max:255',
                Rule::unique('catalog_prices')->where(function ($query) use ($organizationId, $product) {
                    return $query->where('organization_id', $organizationId);
                }),
            ],
            'scope' => ['required', Rule::in(['list', 'custom', 'variant'])],
            'type' => [
                'required',
                Rule::in(ChargeType::values()),
            ],
            'amount' => ['required', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'parent_list_price_id' => [
                new RequiredIf(in_array($this->input('scope'), ['custom', 'variant'])),
                'nullable',
                'integer',
                Rule::exists('catalog_prices', 'id')->where(function ($query) use ($product) {
                    // Ensure parent price belongs to the same product and is a list price
                    return $query->where('product_id', $product->id)
                        ->where('scope', 'list');
                }),
                // Custom validation to ensure type matches parent
                // function ($attribute, $value, $fail) {
                //     if ($value && in_array($this->input('scope'), ['custom', 'variant'])) {
                //         $parentPrice = \App\Models\Catalog\Price::find($value);
                //         if ($parentPrice && $this->input('type') !== $parentPrice->type) {
                //             $fail("The selected type must match the parent price type ({$parentPrice->type->value}).");
                //         }
                //     }
                // },
            ],
            // Recurring fields validation
            'renew_interval' => [
                new RequiredIf(in_array($this->input('type'), ['recurring', 'tiered', 'volume', 'graduated', 'package'])),
                'nullable',
                Rule::in(RenewInterval::values()),
            ],
            'billing_anchor' => [
                'nullable',
                'string',
                'max:255', // Consider specific values if applicable
            ],
            'recurring_interval_count' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'cancel_after_cycles' => ['nullable', 'integer', 'min:1'],
            'properties' => ['nullable', 'array'],
            'properties.tiers' => ['array'],
            'properties.tiers.*.from' => ['integer', 'min:0'],
            'properties.tiers.*.to' => ['nullable', 'integer', 'min:1'],
            'properties.tiers.*.unit_amount' => ['integer', 'min:0'],
            'properties.package' => ['array'],
            'properties.package.size' => ['integer', 'min:1'],
            'properties.package.unit_amount' => ['integer', 'min:0'],

            'gateway_prices' => ['array'],
            'gateway_prices.*' => ['string', 'max:255'],
            'is_active' => ['boolean'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    protected function prepareForValidation()
    {
        $this->mergeIfMissing(['is_active' => true]);

        if ($this->input('scope') === 'list') {
            $this->merge(['parent_list_price_id' => null]);
        }

        // Clear recurring fields for one-time charges
        if ($this->input('type') === ChargeType::ONE_TIME->value) {
            $this->merge([
                'renew_interval' => null,
                'recurring_interval_count' => null,
                'billing_anchor' => null,
                // cancel_after_cycles might apply to non-recurring, keep as is
            ]);
        }

        // Validate and prepare properties for complex pricing models
        $type = $this->input('type');
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
