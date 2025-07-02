<?php

namespace App\Services;

use App\Models\ApiKey;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Str;

class ApiKeyService
{
    /**
     * Generate a new API key for an organization
     */
    public function generateApiKey(Organization $organization, User $user, string $name, string $prefix = 'live'): array
    {
        $uuid = Str::uuid()->toString();
        $secret = config('app.key'); // Use app key as secret
        
        $apiKey = $this->generateApiKeyFromUuid($uuid, $secret, $prefix . '_');
        $keyPreview = ApiKey::generateKeyPreview($apiKey);

        $apiKeyModel = ApiKey::create([
            'name' => $name,
            'key' => $apiKey,
            'prefix' => $prefix,
            'key_preview' => $keyPreview,
            'organization_id' => $organization->id,
            'created_by' => $user->id,
            'is_active' => true,
        ]);

        return [
            'model' => $apiKeyModel,
            'key' => $apiKey, // Only return the actual key once during generation
            'preview' => $keyPreview,
        ];
    }

    /**
     * Validate an API key and return the associated organization
     */
    public function validateApiKey(string $apiKey): ?Organization
    {
        $keyModel = ApiKey::active()->where('key', $apiKey)->first();

        if (!$keyModel) {
            return null;
        }

        $keyModel->markAsUsed();
        
        return $keyModel->organization;
    }

    /**
     * Archive (deactivate) an API key
     */
    public function archiveApiKey(ApiKey $apiKey): bool
    {
        return $apiKey->update(['is_active' => false]);
    }

    /**
     * Activate an API key
     */
    public function activateApiKey(ApiKey $apiKey): bool
    {
        return $apiKey->update(['is_active' => true]);
    }

    /**
     * Get all API keys for an organization
     */
    public function getOrganizationApiKeys(Organization $organization): \Illuminate\Database\Eloquent\Collection
    {
        return ApiKey::forOrganization($organization->id)
            ->with('creator')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Generate API key from UUID (copied from routes/web.php)
     */
    private function generateApiKeyFromUuid(string $uuid, string $secret, string $prefix = 'live_'): string
    {
        $raw = hex2bin(str_replace('-', '', $uuid));
        $key = substr(hash('sha256', $secret, true), 0, 16); // AES-128 key

        $encrypted = openssl_encrypt($raw, 'aes-128-ecb', $key, OPENSSL_RAW_DATA);
        $encoded = $this->base62_encode($encrypted);

        // Always use 32 characters after the prefix
        $targetKeyLength = 32;
        
        // Truncate or pad the encoded string to exactly 32 characters
        if (strlen($encoded) > $targetKeyLength) {
            $encoded = substr($encoded, 0, $targetKeyLength);
        } else {
            $encoded = str_pad($encoded, $targetKeyLength, 'A');
        }

        return $prefix . $encoded;
    }

    /**
     * Decode API key to UUID (for validation if needed)
     */
    private function decodeApiKeyToUuid(string $apiKey, string $secret): string
    {
        $encoded = rtrim(substr($apiKey, strpos($apiKey, '_') + 1), 'A');
        $key = substr(hash('sha256', $secret, true), 0, 16);

        $encrypted = $this->base62_decode($encoded);
        $decrypted = openssl_decrypt($encrypted, 'aes-128-ecb', $key, OPENSSL_RAW_DATA);

        if ($decrypted === false) {
            throw new \RuntimeException('Decryption failed');
        }

        $hex = bin2hex($decrypted);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split($hex, 4));
    }

    /**
     * Base62 encode (copied from routes/web.php)
     */
    private function base62_encode(string $data): string
    {
        $chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        $num = gmp_import($data);
        $str = '';

        while (gmp_cmp($num, 0) > 0) {
            [$num, $rem] = [gmp_div_q($num, 62), gmp_mod($num, 62)];
            $str .= $chars[gmp_intval($rem)];
        }

        return strrev($str);
    }

    /**
     * Base62 decode (copied from routes/web.php)
     */
    private function base62_decode(string $str): string
    {
        $chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        $num = gmp_init(0);

        foreach (str_split($str) as $char) {
            $num = gmp_add(gmp_mul($num, 62), strpos($chars, $char));
        }

        return gmp_export($num);
    }
} 