<?php

namespace App\Http\Requests\Product;

use App\Models\Catalog\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProductUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization: Check if user can update this specific product
        $product = $this->route('product');
        // Ensure product belongs to the current user's organization
        return Auth::user()->currentOrganization->id === $product->organization_id;
        // Optional: Add policy check: return $this->user()->can('update', $product);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productId = $this->route('product')->id;
        $organizationId = Auth::user()->currentOrganization->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'lookup_key' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Product::class)
                    ->where(function ($query) use ($organizationId) {
                        return $query->where('organization_id', $organizationId);
                    })
                    ->ignore($productId)
            ],
            'gateway_provider' => ['nullable', 'string', 'max:255'],
            'gateway_product_id' => ['nullable', 'string', 'max:255'],
            // Add validation for archiving if that's handled here
            // 'archived_at' => ['nullable', 'date'],
        ];
    }
}
