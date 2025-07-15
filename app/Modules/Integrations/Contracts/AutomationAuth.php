<?php

namespace App\Modules\Integrations\Contracts;

use App\Models\Integration;

interface AutomationAuth
{
    /**
     * Get authentication configuration for this integration
     */
    public function auth(): array;

    /**
     * Get the credential fields required for authentication
     */
    public function getCredentialFields(): array;

    /**
     * Validate credentials for this integration
     */
    public function validateCredentials(array $credentials): array;

    /**
     * Process/normalize credentials before storage
     */
    public function processCredentials(array $credentials): array;

    /**
     * Test the connection with the given credentials
     */
    public function testConnection(Integration $integration): array;

    /**
     * Get authentication type (api_key, oauth, webhook, etc.)
     */
    public function getAuthType(): string;

    /**
     * Get help information for setting up authentication
     */
    public function getAuthHelp(): array;
} 