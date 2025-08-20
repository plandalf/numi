<?php
namespace App\Http\Requests\Price;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ImportRequest extends FormRequest
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
        return [
            'gateway_prices' => ['array'],
            'gateway_prices.*' => ['string', 'max:255'],
            'parent_list_price_id' => ['nullable', 'integer'],
            'scope' => ['nullable', 'in:list,custom,variant'],
        ];
    }
}
