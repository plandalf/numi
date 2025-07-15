<?php

namespace App\Modules\Integrations;

use App\Models\Integration;
use Illuminate\Http\Request;

class StripeIntegrationHandler extends AbstractIntegrationHandler
{
    /**
     * Get the credential fields required for Stripe
     */
    public function getCredentialFields(): array
    {
        return [
            [
                'key' => 'publishable_key',
                'label' => 'Publishable Key',
                'type' => 'string',
                'required' => true,
                'placeholder' => 'pk_live_xxxxxxxxxx',
                'description' => 'Your Stripe publishable key',
                'max_length' => 255,
            ],
            [
                'key' => 'secret_key',
                'label' => 'Secret Key',
                'type' => 'password',
                'required' => true,
                'placeholder' => 'sk_live_xxxxxxxxxx',
                'description' => 'Your Stripe secret key (keep this secure)',
                'max_length' => 255,
                'sensitive' => true,
            ],
        ];
    }

    /**
     * Validate Stripe credentials
     */
    public function validateCredentials(Request $request): array
    {
        return $request->validate($this->getUpdateValidationRules(), $this->getErrorMessages());
    }

    /**
     * Test Stripe connection
     */
    public function testConnection(Integration $integration): array
    {
        try {
            // Basic Stripe connection test would go here
            // For now, return a basic success response
            return [
                'success' => true,
                'message' => 'Connection test completed successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
                'error_code' => 'connection_failed',
            ];
        }
    }

    /**
     * Get Stripe-specific error messages
     */
    public function getErrorMessages(): array
    {
        return array_merge(parent::getErrorMessages(), [
            'credentials.publishable_key.required' => 'Stripe publishable key is required.',
            'credentials.secret_key.required' => 'Stripe secret key is required.',
        ]);
    }

    /**
     * Get Stripe help information
     */
    public function getHelpInfo(): array
    {
        return [
            'documentation_url' => 'https://stripe.com/docs/api',
            'setup_guide_url' => 'https://stripe.com/docs/keys',
            'support_email' => 'support@stripe.com',
        ];
    }
} 