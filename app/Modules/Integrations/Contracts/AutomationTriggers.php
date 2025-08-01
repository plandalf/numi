<?php

namespace App\Modules\Integrations\Contracts;

interface AutomationTriggers
{
    /**
     * Get all available triggers for this integration
     */
    public function triggers(): array;

    /**
     * Get a specific trigger configuration
     */
    public function getTrigger(string $triggerKey): ?array;

    /**
     * Get webhook events mapped to trigger keys
     */
    public function getWebhookEvents(): array;

    /**
     * Handle webhook payload for a specific trigger
     */
    public function handleWebhook(string $triggerKey, array $payload): array;

    /**
     * Test if a trigger is properly configured
     */
    public function validateTrigger(string $triggerKey, array $configuration = []): array;

    /**
     * Test a trigger by fetching real data from the integration
     * Returns sample data that would be used to trigger the workflow
     */
    public function testTrigger(string $triggerKey, array $configuration = []): array;
} 