<?php

namespace App\Modules\Integrations;

use App\Models\Integration;
use App\Modules\Integrations\Kajabi;
use Illuminate\Http\Request;

class KajabiIntegrationHandler extends AbstractIntegrationHandler
{
    /**
     * Get the credential fields required for Kajabi
     */
    public function getCredentialFields(): array
    {
        // Delegate to the Kajabi class which implements AutomationAuth
        $kajabi = new Kajabi('', '', ''); // Empty constructor just for method access
        return $kajabi->getCredentialFields();
    }

    /**
     * Validate Kajabi credentials
     */
    public function validateCredentials(Request $request): array
    {
        return $request->validate($this->getUpdateValidationRules(), $this->getErrorMessages());
    }

    /**
     * Process Kajabi credentials before storage
     */
    public function processCredentials(array $credentials): array
    {
        // Delegate to the Kajabi class which implements AutomationAuth
        $kajabi = new Kajabi('', '', ''); // Empty constructor just for method access
        return $kajabi->processCredentials($credentials);
    }

    /**
     * Test Kajabi connection
     */
    public function testConnection(Integration $integration): array
    {
        try {
            $kajabi = Kajabi::fromIntegration($integration);
            return $kajabi->testConnection($integration);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
                'error_code' => 'connection_failed',
            ];
        }
    }

    /**
     * Get Kajabi-specific error messages
     */
    public function getErrorMessages(): array
    {
        return array_merge(parent::getErrorMessages(), [
            'credentials.client_id.required' => 'Kajabi Client ID is required.',
            'credentials.client_secret.required' => 'Kajabi Client Secret is required.',
            'credentials.subdomain.required' => 'Kajabi subdomain is required.',
            'credentials.subdomain.regex' => 'Subdomain can only contain letters, numbers, and hyphens.',
        ]);
    }

    /**
     * Get Kajabi help information
     */
    public function getHelpInfo(): array
    {
        return [
            'documentation_url' => 'https://help.kajabi.com/hc/en-us/articles/360037441834',
            'setup_guide_url' => 'https://help.kajabi.com/hc/en-us/sections/360000579294-Integrations',
            'support_email' => 'support@kajabi.com',
            'video_tutorial_url' => 'https://www.kajabi.com/integrations-tutorial',
        ];
    }

    /**
     * Validate subdomain format and provide helpful error messages
     */
    public function validateSubdomain(string $subdomain): array
    {
        $subdomain = strtolower(trim($subdomain));
        
        // Remove .kajabi.com if user included it
        $subdomain = str_replace('.kajabi.com', '', $subdomain);
        
        // Check if it's just a number
        if (is_numeric($subdomain)) {
            return [
                'valid' => false,
                'error' => 'Subdomain cannot be just a number',
                'suggestion' => 'Use your actual Kajabi site subdomain (e.g., "mycompany")',
            ];
        }
        
        // Check minimum length
        if (strlen($subdomain) < 3) {
            return [
                'valid' => false,
                'error' => 'Subdomain must be at least 3 characters long',
                'suggestion' => 'Use your full Kajabi site subdomain',
            ];
        }
        
        // Check for invalid characters
        if (!preg_match('/^[a-z0-9-]+$/', $subdomain)) {
            return [
                'valid' => false,
                'error' => 'Subdomain can only contain letters, numbers, and hyphens',
                'suggestion' => 'Remove any special characters except hyphens',
            ];
        }
        
        return [
            'valid' => true,
            'subdomain' => $subdomain,
        ];
    }

    /**
     * Get user-friendly connection error messages
     */
    public function translateConnectionError(string $error): string
    {
        $errorLower = strtolower($error);
        
        if (str_contains($errorLower, 'could not resolve host')) {
            $subdomain = $this->extractSubdomainFromError($error);
            return "❌ Invalid subdomain '{$subdomain}'. Please check your Kajabi site URL and enter the correct subdomain.";
        }
        
        if (str_contains($errorLower, 'unauthorized') || str_contains($errorLower, '401')) {
            return "❌ Invalid credentials. Please check your Client ID and Client Secret.";
        }
        
        if (str_contains($errorLower, 'forbidden') || str_contains($errorLower, '403')) {
            return "❌ Access denied. Please ensure your API credentials have the necessary permissions.";
        }
        
        if (str_contains($errorLower, 'timeout')) {
            return "❌ Connection timeout. Please check your internet connection and try again.";
        }
        
        return "❌ Connection failed: " . $error;
    }

    /**
     * Extract subdomain from error message for better error reporting
     */
    private function extractSubdomainFromError(string $error): string
    {
        if (preg_match('/could not resolve host: ([^.]+)\.kajabi\.com/i', $error, $matches)) {
            return $matches[1];
        }
        
        return 'unknown';
    }
} 