<?php

declare(strict_types=1);

namespace App\Http\Requests\Offer;

use App\Models\Catalog\Price;
use App\Models\Store\Offer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class OfferSlotStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $offer = $this->route('offer');

        // Ensure the offer belongs to the user's current organization
        return $offer instanceof Offer
            && $offer->organization_id === Auth::user()->currentOrganization->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $offer = $this->route('offer');
        $organizationId = Auth::user()->currentOrganization->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('store_offer_slots')->where(function ($query) use ($offer) {
                    return $query->where('offer_id', $offer->id);
                }),
                'regex:/^[a-z0-9_]+$/' // Ensure key is snake_case and alphanumeric
            ],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_required' => ['required', 'boolean'],
            'default_price_id' => [
                'nullable',
                'integer',
                Rule::exists('catalog_prices', 'id')->where(function ($query) use ($organizationId) {
                    return $query->where('organization_id', $organizationId)
                                ->where('is_active', true);
                })
            ],
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
                'is_required' => filter_var($this->input('is_required'), FILTER_VALIDATE_BOOLEAN)
            ]);
        }
        // Ensure sort_order is integer
        if ($this->has('sort_order')) {
            $this->merge([
                 'sort_order' => (int) $this->input('sort_order', 0)
            ]);
        }
        // Ensure default_price_id is null if empty string or not present
         if (!$this->input('default_price_id')) {
             $this->merge(['default_price_id' => null]);
         }
    }
}
