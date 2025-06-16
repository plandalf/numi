<?php

declare(strict_types=1);

namespace App\Http\Requests\Offer;

use App\Models\Catalog\Price;
use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class OfferItemUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
        $offer = $this->route('offer');
        $offerItem = $this->route('offerItem');

        // Ensure the offer belongs to the user's current organization
        // and the offerItem belongs to the offer
        return $offer instanceof Offer
            && $offerItem instanceof OfferItem
            && $offer->organization_id === Auth::user()->currentOrganization->id
            && $offerItem->offer_id === $offer->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $offer = $this->route('offer');
        $offerItem = $this->route('offerItem');
        $organizationId = Auth::user()->currentOrganization->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'key' => [
                'sometimes',
                'string',
                'max:255',
                // Key must be unique within the *offer*
                // Use the actual table name from OfferItem model if different
                // $offerItem->getTable()
                // Rule::unique('store_offer_items')->where(function ($query) use ($offer) {
                //     return $query->where('offer_id', $offer->id);
                // })->ignore($offerItem->id), // Ignore the current offerItem being updated
                'regex:/^[a-z0-9_]+$/', // Ensure key is snake_case and alphanumeric
            ],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_required' => ['sometimes', 'boolean'],
            'is_highlighted' => ['sometimes', 'boolean'],
            'is_tax_inclusive' => ['sometimes', 'boolean'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'default_price_id' => [
                'nullable',
                'integer',
                Rule::exists('catalog_prices', 'id')->where(function ($query) use ($organizationId) {
                    return $query->where('organization_id', $organizationId)
                        ->where('is_active', true);
                }),
            ],
            'prices' => ['array'],
            'prices.*' => ['integer', Rule::exists('catalog_prices', 'id')->where(function ($query) use ($organizationId) {
                return $query->where('organization_id', $organizationId)
                    ->where('is_active', true);
            })],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure boolean value for is_required
        if ($this->has('is_required')) {
            $this->merge([
                'is_required' => filter_var($this->input('is_required'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
        // Ensure sort_order is integer
        if ($this->has('sort_order')) {
            $this->merge([
                'sort_order' => (int) $this->input('sort_order', 0),
            ]);
        }
        // Ensure default_price_id is null if empty string or not present
        if (! $this->input('default_price_id')) {
            $this->merge(['default_price_id' => null]);
        }
    }
}
