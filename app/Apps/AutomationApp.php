<?php

namespace App\Apps;

abstract class AutomationApp
{
    /* @return array<string> */
    abstract public function actions(): array;

    /* @return array<string> */
    abstract public function triggers(): array;

    /* @return array<string> */
    public function resources(): array
    {
        return [];
    }

    /**
     * Define the authentication requirements for this app
     * 
     * @return array{type: string, fields: array<array{key: string, label: string, type: string, required: boolean, placeholder?: string, help?: string}>}
     */
    public function authRequirements(): array
    {
        return [
            'type' => 'none',
            'fields' => []
        ];
    }

    /**
     * Test the integration connection
     * Apps can override this to provide their own testing logic
     */
    public function test($integration): array
    {
        // Default implementation - just verify auth method exists
        try {
            $connector = $this->auth($integration);
            return [
                'status' => 'connected',
                'test_time' => now()->toISOString(),
                'message' => 'App connector created successfully'
            ];
        } catch (\Exception $e) {
            throw new \Exception('Connection test failed: ' . $e->getMessage());
        }
    }
}
