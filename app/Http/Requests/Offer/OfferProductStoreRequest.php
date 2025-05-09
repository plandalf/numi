<?php
namespace App\Http\Requests\Offer;

use App\Models\Store\Offer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class OfferProductStoreRequest extends FormRequest
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
        $organizationId = Auth::user()->currentOrganization->id;

        return [
            'product_id' => [
                'required',
                'integer',
                Rule::exists('catalog_products', 'id')->where(function ($query) use ($organizationId) {
                    return $query->where('organization_id', $organizationId);
                }),
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
