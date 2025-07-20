<?php

namespace App\ValueObjects;

class BillingDetails
{
    public ?string $email;
    public ?string $name;
    public ?string $phone;
    public ?array $address;

    public function __construct(array $data)
    {
        $this->email = $data['email'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->phone = $data['phone'] ?? null;
        $this->address = $data['address'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'name' => $this->name,
            'phone' => $this->phone,
            'address' => $this->address,
        ];
    }
} 