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
            // Normalized tier structure (direct array of tiers)
            'properties.*.up_to' => ['nullable', 'integer', 'min:1'],
            'properties.*.unit_amount' => ['integer', 'min:0'],
            'properties.*.flat_amount' => ['nullable', 'integer', 'min:0'],
            // Package structure (if used)
            'properties.package' => ['array'],
            'properties.package.size' => ['integer', 'min:1'],
            'properties.package.unit_amount' => ['integer', 'min:0'],

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

        // For custom/variant prices, ensure we do NOT link to gateway objects
        if (in_array($this->input('scope'), ['custom', 'variant'])) {
            $this->merge([
                'gateway_provider' => null,
                'gateway_price_id' => null,
            ]);
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

        // Validate and normalize properties for complex pricing models
        $type = $this->input('type');
        if (in_array($type, ['tiered', 'volume', 'graduated', 'package'])) {
            $properties = $this->input('properties');
            
            // For tier-based pricing (tiered, volume, graduated)
            if (in_array($type, ['tiered', 'volume', 'graduated']) && $properties) {
                // Support both legacy {tiers: []} and normalized direct array []
                if (isset($properties['tiers']) && is_array($properties['tiers'])) {
                    $properties = $properties['tiers'];
                }

                if (is_array($properties)) {
                    $normalized = [];
                    $lastUpTo = 0;
                    foreach ($properties as $index => $tier) {
                        if (!is_array($tier)) continue;
                        // Allow from/to or up_to; convert to up_to only
                        $upTo = $tier['up_to'] ?? ($tier['to'] ?? null);
                        // Determine unit/flat amounts
                        $unitAmount = $tier['unit_amount'] ?? null;
                        $flatAmount = $tier['flat_amount'] ?? null;
                        if (!is_numeric($unitAmount) && !is_numeric($flatAmount)) continue;
                        // Ensure monotonic up_to
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

                    // Sort by up_to ascending, null last
                    usort($normalized, function ($a, $b) {
                        $aU = $a['up_to'] ?? PHP_INT_MAX;
                        $bU = $b['up_to'] ?? PHP_INT_MAX;
                        return $aU <=> $bU;
                    });

                    $this->merge(['properties' => $normalized]);
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

        // If request claims simple recurring but provides tiers, normalize to our internal mapping
        // Default to 'graduated' when tiers are present and type is 'recurring'
        if ($this->input('type') === ChargeType::RECURRING->value) {
            $properties = $this->input('properties');
            if (isset($properties['tiers']) && is_array($properties['tiers']) && count($properties['tiers']) > 0) {
                $this->merge(['type' => ChargeType::GRADUATED->value]);
            }
        }
    }
}
