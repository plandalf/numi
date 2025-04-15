<?php

declare(strict_types=1);

namespace App\Http\Requests\Price;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\RequiredIf;
use App\Enums\ChargeType;

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
                    return $query->where('organization_id', $organizationId)
                                ->where('product_id', $product->id);
                })
            ],
            'scope' => ['required', Rule::in(['list', 'custom'])],
            'type' => [
                'required',
                Rule::in(ChargeType::values())
            ],
            'amount' => ['required', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'parent_list_price_id' => [
                new RequiredIf($this->input('scope') === 'custom'),
                'nullable',
                'integer',
                Rule::exists('catalog_prices', 'id')->where(function ($query) use ($product) {
                    // Ensure parent price belongs to the same product and is a list price
                    return $query->where('product_id', $product->id)
                                ->where('scope', 'list');
                })
            ],
            // Recurring fields validation
            'renew_interval' => [
                new RequiredIf($this->input('type') === 'recurring'),
                'nullable',
                Rule::in(['day', 'week', 'month', 'year'])
            ],
            'billing_anchor' => [
                new RequiredIf($this->input('type') === 'recurring'),
                'nullable',
                'string',
                'max:255' // Consider specific values if applicable
            ],
            'recurring_interval_count' => [
                new RequiredIf($this->input('type') === 'recurring'),
                'nullable',
                'integer',
                'min:1'
            ],
            'cancel_after_cycles' => ['nullable', 'integer', 'min:1'],
            'properties' => ['nullable', 'array'],
            // TODO: Add validation for tiered/volume/graduated/package properties if needed

            'gateway_provider' => ['nullable', 'string', 'max:255'],
            'gateway_price_id' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }

    protected function prepareForValidation()
    {
        $this->mergeIfMissing(['is_active' => true]);

        if ($this->input('scope') === 'list') {
            $this->merge(['parent_list_price_id' => null]);
        }

        if ($this->input('type') !== 'recurring') {
             $this->merge([
                 'renew_interval' => null,
                 'recurring_interval_count' => null,
                 'billing_anchor' => null,
                 // cancel_after_cycles might apply to non-recurring, keep as is
             ]);
        }

        // TODO: Add preparation logic for properties based on type
    }
}
