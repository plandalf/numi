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
            'scope' => ['sometimes', Rule::in(['list', 'custom', 'variant'])],
            

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
                // Custom validation to ensure type matches parent (compare values)
                function ($attribute, $value, $fail) use ($price) {
                    if ($value && in_array($this->input('scope', $price->scope), ['custom', 'variant'])) {
                        $parentPrice = \App\Models\Catalog\Price::find($value);
                        if ($parentPrice) {
                            $childType = is_string($this->input('type', $price->type)) ? $this->input('type', $price->type) : $price->type->value;
                            $parentType = $parentPrice->type?->value ?? (string) $parentPrice->type;
                            if ($childType !== $parentType) {
                                $fail("The selected type must match the parent price type ({$parentType}).");
                            }
                        }
                    }
                },
            ],
            'renew_interval' => [
                'sometimes',
                new RequiredIf(in_array($this->input('type', $price->type->value), ['recurring', 'tiered', 'volume', 'graduated', 'package'])),
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
            'properties.*.up_to' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'properties.*.unit_amount' => ['sometimes', 'integer', 'min:0'],
            'properties.*.flat_amount' => ['sometimes', 'nullable', 'integer', 'min:0'],
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

        // Retain gateway linkage even when moving to custom/variant

        // Ensure recurring fields are null if not recurring model
        if ($this->input('type', $price->type) === ChargeType::ONE_TIME->value) {
            $this->merge([
                'renew_interval' => null,
                'recurring_interval_count' => null,
                'billing_anchor' => null,
            ]);
        }

        // Validate and normalize properties for complex pricing models
        $type = is_string($this->input('type', $price->type)) ? $this->input('type', $price->type) : $price->type->value;
        if (in_array($type, ['tiered', 'volume', 'graduated', 'package'])) {
            $properties = $this->input('properties');
            if (in_array($type, ['tiered', 'volume', 'graduated'])) {
                if (isset($properties['tiers']) && is_array($properties['tiers'])) {
                    $properties = $properties['tiers'];
                }
                if (is_array($properties)) {
                    $normalized = [];
                    $lastUpTo = 0;
                    foreach ($properties as $index => $tier) {
                        if (!is_array($tier)) continue;
                        $upTo = $tier['up_to'] ?? ($tier['to'] ?? null);
                        $unitAmount = $tier['unit_amount'] ?? null;
                        $flatAmount = $tier['flat_amount'] ?? null;
                        if (!is_numeric($unitAmount) && !is_numeric($flatAmount)) continue;
                        if ($upTo !== null && is_numeric($upTo)) {
                            $upTo = (int) $upTo;
                            if ($upTo <= $lastUpTo) {
                                $upTo = $lastUpTo + 1;
                            }
                            $lastUpTo = $upTo;
                        } else {
                            $upTo = null;
                        }
                        $normalized[] = [
                            'up_to' => $upTo,
                            'unit_amount' => (int) max(0, (int) ($unitAmount ?? 0)),
                            'flat_amount' => isset($flatAmount) ? (int) max(0, (int) $flatAmount) : null,
                        ];
                    }
                    usort($normalized, function ($a, $b) {
                        $aU = $a['up_to'] ?? PHP_INT_MAX;
                        $bU = $b['up_to'] ?? PHP_INT_MAX;
                        return $aU <=> $bU;
                    });
                    $this->merge(['properties' => $normalized]);
                }
            } elseif ($type === 'package' && $properties) {
                if (isset($properties['package']) && is_array($properties['package'])) {
                    $package = $properties['package'];
                    if (isset($package['size'], $package['unit_amount']) && is_numeric($package['size']) && is_numeric($package['unit_amount'])) {
                        $this->merge(['properties' => ['package' => $package]]);
                    } else {
                        $this->merge(['properties' => null]);
                    }
                }
            }
        }
    }
}
