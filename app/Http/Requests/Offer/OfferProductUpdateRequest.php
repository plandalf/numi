<?php
namespace App\Http\Requests\Offer;

use App\Models\Store\Offer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class OfferProductUpdateRequest extends OfferProductStoreRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $organizationId = Auth::user()->currentOrganization->id;

        return [
            'product_id' => [
                'required',
                'integer',
                Rule::exists('catalog_products', 'id')->where(function ($query) use ($organizationId) {
                    return $query->where('organization_id', $organizationId);
                }),
                Rule::unique('store_offer_products', 'product_id')->where(function ($query) {
                    return $query->where('offer_id', $this->route('offer')->id);
                })->ignore($this->route('offerProduct.id') ?? null),
            ],
            'prices' => ['array'],
            'prices.*' => [
                'integer',
                Rule::exists('catalog_prices', 'id')->where(function ($query) use ($organizationId) {
                    return $query->where('organization_id', $organizationId)
                        ->where('is_active', true);
                }),
            ],
        ];
    }
}
