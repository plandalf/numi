<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ApiKey;
use App\ValueObjects\CheckoutAuthorization;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;

class CustomerTokenService
{
    public function __construct()
    {
    }

    public function decode(string $jwt): ?CheckoutAuthorization
    {
        try {
            $headers = json_decode(JWT::urlsafeB64Decode(collect(explode('.', $jwt))->first()), true);
            $kid = $headers['kid'] ?? null;

            $apiKey = ApiKey::retrieve($kid);
            $keys = new Key($apiKey->key, 'HS256');
            if (! $keys) {
                throw new \RuntimeException('No active API key secret available');
            }

            $decoded = JWT::decode($jwt, $keys);
            $payload = json_decode(json_encode($decoded), true);

            $email = data_get($payload, 'email');
            $name = data_get($payload, 'name');
            $stripeCustomerId = data_get($payload, 'customer')
                ?? data_get($payload, 'customer_id')
                ?? data_get($payload, 'id');
            $userId = data_get($payload, 'sub');
            $groupId = data_get($payload, 'grp');
            $subscriptionId = data_get($payload, 'subscription')
                ?? data_get($payload, 'subscription_id');

            $customerProps = [];
            if ($email) $customerProps['email'] = (string) $email;
            if ($name) $customerProps['name'] = (string) $name;

            return new CheckoutAuthorization(
                stripeCustomerId: $stripeCustomerId ? (string) $stripeCustomerId : null,
                userId: $userId ? (string) $userId : null,
                groupId: $groupId ? (string) $groupId : null,
                subscriptionId: $subscriptionId ? (string) $subscriptionId : null,
                customerProperties: $customerProps,
            );
        } catch (\Throwable $e) {
            Log::warning('Invalid checkout customer token', ['error' => $e->getMessage()]);
            return null;
        }
    }
}


