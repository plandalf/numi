<?php

namespace App\Modules\Integrations;

use App\Models\Integration;
use Illuminate\Http\Request;

abstract class AbstractIntegrationHandler
{
    /**
     * Get the credential fields required for this integration type
     */
    abstract public function getCredentialFields(): array;

    /**
     * Validate the credentials for this integration type
     */
    abstract public function validateCredentials(Request $request): array;

    /**
     * Test the connection for this integration
     */
    abstract public function testConnection(Integration $integration): array;

    /**
     * Process credentials before storage (e.g., formatting, normalization)
     */
    public function processCredentials(array $credentials): array
    {
        return $credentials;
    }

    /**
     * Get validation rules for creating this integration
     */
    public function getCreateValidationRules(): array
    {
        $rules = [];
        foreach ($this->getCredentialFields() as $field) {
            $fieldRules = [];
            
            if ($field['required']) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }
            
            $fieldRules[] = $field['type'] === 'email' ? 'email' : 'string';
            
            if (isset($field['max_length'])) {
                $fieldRules[] = 'max:' . $field['max_length'];
            }
            
            if (isset($field['validation'])) {
                $fieldRules[] = $field['validation'];
            }
            
            $rules["credentials.{$field['key']}"] = implode('|', $fieldRules);
        }
        
        return $rules;
    }

    /**
     * Get validation rules for updating this integration
     */
    public function getUpdateValidationRules(): array
    {
        $rules = [];
        foreach ($this->getCredentialFields() as $field) {
            $fieldRules = [];
            
            if ($field['required']) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }
            
            $fieldRules[] = $field['type'] === 'email' ? 'email' : 'string';
            
            if (isset($field['max_length'])) {
                $fieldRules[] = 'max:' . $field['max_length'];
            }
            
            if (isset($field['validation'])) {
                $fieldRules[] = $field['validation'];
            }
            
            $rules["credentials.{$field['key']}"] = implode('|', $fieldRules);
        }
        
        return $rules;
    }

    /**
     * Get user-friendly error messages for common issues
     */
    public function getErrorMessages(): array
    {
        return [
            'credentials.*.required' => 'This field is required.',
            'credentials.*.string' => 'This field must be a valid string.',
            'credentials.*.email' => 'This field must be a valid email address.',
        ];
    }

    /**
     * Get help text or documentation links for this integration
     */
    public function getHelpInfo(): array
    {
        return [
            'documentation_url' => null,
            'setup_guide_url' => null,
            'support_email' => null,
        ];
    }
} 