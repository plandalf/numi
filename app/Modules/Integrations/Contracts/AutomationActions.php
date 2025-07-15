<?php

namespace App\Modules\Integrations\Contracts;

interface AutomationActions
{
    /**
     * Get all available actions for this integration
     */
    public function actions(): array;

    /**
     * Get a specific action configuration
     */
    public function getAction(string $actionKey): ?array;

    /**
     * Execute an action with the given input
     */
    public function executeAction(string $actionKey, array $input): array;

    /**
     * Test an action execution without side effects
     */
    public function testAction(string $actionKey, array $input): array;

    /**
     * Validate action input against its schema
     */
    public function validateAction(string $actionKey, array $input): array;
} 