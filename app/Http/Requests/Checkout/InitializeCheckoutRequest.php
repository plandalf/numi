<?php

declare(strict_types=1);

namespace App\Http\Requests\Checkout;

use App\Enums\RenewInterval;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

class InitializeCheckoutRequest extends FormRequest
{
    private ?bool $testMode = null;
    /** @var array{email?:string,name?:string} */
    private array $resolvedCustomerProperties = [];
    private ?string $resolvedSubscription = null;
    private ?string $resolvedIntent = null;
    private ?int $resolvedQuantity = null;
    private ?string $resolvedCurrency = null;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['sometimes', 'array'],
            'items.*.lookup_key' => ['required_with:items', 'string'],
            'price' => ['sometimes', 'string'],
            'interval' => ['sometimes', 'string', 'in:'.implode(',', RenewInterval::values())],
            'currency' => ['sometimes', 'string'],
            'customer' => ['sometimes'], // can be JWT string or array
            'subject' => ['sometimes', 'string'],
            'subscription' => ['sometimes', 'string'],
            'intent' => ['sometimes', 'string', 'in:purchase,upgrade'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $items = $this->input('items');
        $price = $this->input('price');

        if ((empty($items) || ! is_array($items)) && is_string($price) && $price !== '') {
            $this->merge([
                'items' => [['lookup_key' => $price]],
            ]);
        }
    }

    /**
     * @return array<int, array{lookup_key:string}>
     */
    public function items(): array
    {
        $items = Arr::wrap($this->input('items', []));
        return array_values(array_filter(array_map(function ($item) {
            if (is_array($item) && isset($item['lookup_key']) && is_string($item['lookup_key'])) {
                return ['lookup_key' => $item['lookup_key']];
            }
            return null;
        }, $items)));
    }

    public function primaryPriceLookup(): ?string
    {
        $price = $this->input('price');
        return is_string($price) && $price !== '' ? $price : null;
    }

    public function intervalOverride(): ?string
    {
        $interval = $this->input('interval');
        return is_string($interval) && $interval !== '' ? strtolower($interval) : null;
    }

    public function currencyOverride(): ?string
    {
        $currency = $this->input('currency');
        return is_string($currency) && $currency !== '' ? strtolower($currency) : null;
    }

    public function setResolvedCurrency(?string $currency): void
    {
        $this->resolvedCurrency = $currency ? strtolower($currency) : null;
    }

    public function currency(): ?string
    {
        return $this->resolvedCurrency ?? $this->currencyOverride();
    }

    /**
     * @return array{email?:string,name?:string}
     */
    public function customerAsArray(): array
    {
        $customer = $this->input('customer');
        $result = [];
        if (is_array($customer)) {
            if (isset($customer['email']) && is_string($customer['email'])) {
                $result['email'] = $customer['email'];
            }
            if (isset($customer['name']) && is_string($customer['name'])) {
                $result['name'] = $customer['name'];
            }
        }
        return $result;
    }

    public function customerToken(): ?string
    {
        $customer = $this->input('customer');
        if (is_string($customer) && substr_count($customer, '.') === 2) {
            return $customer;
        }
        return null;
    }

    public function subject(): ?string
    {
        $value = $this->input('subject');
        return is_string($value) && $value !== '' ? $value : null;
    }

    public function subscription(): ?string
    {
        $value = $this->input('subscription');
        return is_string($value) && $value !== '' ? $value : null;
    }

    public function intent(?string $derivedSubscription = null): string
    {
        $intent = $this->input('intent');
        if (is_string($intent) && in_array($intent, ['purchase', 'upgrade'], true)) {
            return $intent;
        }
        return $derivedSubscription ? 'upgrade' : 'purchase';
    }

    public function quantity(): ?int
    {
        $value = $this->input('quantity');
        return is_numeric($value) ? (int) $value : null;
    }

    // Resolved setters/getters for controller-provided values
    public function setTestMode(bool $testMode): void
    {
        $this->testMode = $testMode;
    }

    public function testMode(): bool
    {
        return (bool) ($this->testMode ?? false);
    }

    /**
     * @param array{email?:string,name?:string} $props
     */
    public function setResolvedCustomerProperties(array $props): void
    {
        $this->resolvedCustomerProperties = $props;
    }

    /**
     * @return array{email?:string,name?:string}
     */
    public function resolvedCustomerProperties(): array
    {
        return !empty($this->resolvedCustomerProperties) ? $this->resolvedCustomerProperties : $this->customerAsArray();
    }

    public function setResolvedSubscription(?string $subscription): void
    {
        $this->resolvedSubscription = $subscription;
    }

    public function resolvedSubscription(): ?string
    {
        return $this->resolvedSubscription ?? $this->subscription();
    }

    public function setResolvedIntent(?string $intent): void
    {
        $this->resolvedIntent = $intent;
    }

    public function resolvedIntent(): string
    {
        if ($this->resolvedIntent) {
            return $this->resolvedIntent;
        }
        return $this->intent($this->resolvedSubscription());
    }

    public function setResolvedQuantity(?int $quantity): void
    {
        $this->resolvedQuantity = $quantity;
    }

    public function resolvedQuantity(): ?int
    {
        return $this->resolvedQuantity ?? $this->quantity();
    }
}


