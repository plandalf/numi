<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use App\Enums\ProductState;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TransitionStateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');
        return Auth::user()->currentOrganization->id === $product->organization_id;
    }

    public function rules(): array
    {
        return [
            'to' => ['required', Rule::in(array_map(fn($e) => $e->value, ProductState::cases()))],
        ];
    }
}


