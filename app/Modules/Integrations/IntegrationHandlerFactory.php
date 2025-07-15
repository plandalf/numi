<?php

namespace App\Modules\Integrations;

use App\Enums\IntegrationType;
use App\Models\Integration;
use App\Modules\Integrations\Contracts\AutomationTriggers;
use App\Modules\Integrations\Contracts\AutomationActions;
use App\Modules\Integrations\Contracts\AutomationAuth;

class IntegrationHandlerFactory
{
    /**
     * Create the appropriate integration handler for the given integration type
     */
    public static function create(IntegrationType $integrationType): AbstractIntegrationHandler
    {
        return match ($integrationType) {
            IntegrationType::KAJABI => new KajabiIntegrationHandler(),
            IntegrationType::STRIPE, IntegrationType::STRIPE_TEST => new StripeIntegrationHandler(),
            default => throw new \InvalidArgumentException("Unsupported integration type: {$integrationType->value}"),
        };
    }

    /**
     * Create the appropriate integration class (implements all interfaces)
     */
    public static function createIntegration(IntegrationType $integrationType): AutomationTriggers&AutomationActions&AutomationAuth
    {
        return match ($integrationType) {
            IntegrationType::KAJABI => new Kajabi('', '', ''), // Will use fromIntegration() in practice
            default => throw new \InvalidArgumentException("Unsupported integration type: {$integrationType->value}"),
        };
    }

    /**
     * Create integration from Integration model
     */
    public static function createIntegrationFromModel(Integration $integration): AutomationTriggers&AutomationActions&AutomationAuth
    {
        return match ($integration->type) {
            IntegrationType::KAJABI => Kajabi::fromIntegration($integration),
            default => throw new \InvalidArgumentException("Unsupported integration type: {$integration->type->value}"),
        };
    }

    /**
     * Create handler from Integration model
     */
    public static function createFromIntegration(Integration $integration): AbstractIntegrationHandler
    {
        return self::create($integration->type);
    }

    /**
     * Get available integration types with their handlers
     */
    public static function getAvailableIntegrations(): array
    {
        return [
            IntegrationType::KAJABI->value => [
                'name' => 'Kajabi',
                'description' => 'Online course and membership platform',
                'icon' => 'kajabi',
                'color' => '#FF6B35',
                'category' => 'education',
                'handler' => KajabiIntegrationHandler::class,
            ],
            IntegrationType::STRIPE->value => [
                'name' => 'Stripe',
                'description' => 'Payment processing platform',
                'icon' => 'stripe',
                'color' => '#635BFF',
                'category' => 'payment',
                'handler' => StripeIntegrationHandler::class,
            ],
            IntegrationType::STRIPE_TEST->value => [
                'name' => 'Stripe (Test)',
                'description' => 'Stripe test environment',
                'icon' => 'stripe',
                'color' => '#00D924',
                'category' => 'payment',
                'handler' => StripeIntegrationHandler::class,
            ],
        ];
    }

    /**
     * Check if an integration type is supported
     */
    public static function isSupported(IntegrationType $integrationType): bool
    {
        return match ($integrationType) {
            IntegrationType::KAJABI,
            IntegrationType::STRIPE,
            IntegrationType::STRIPE_TEST => true,
            default => false,
        };
    }

    /**
     * Get credential fields for a specific integration type
     */
    public static function getCredentialFields(IntegrationType $integrationType): array
    {
        $handler = self::create($integrationType);
        return $handler->getCredentialFields();
    }

    /**
     * Get validation rules for a specific integration type
     */
    public static function getValidationRules(IntegrationType $integrationType, bool $isUpdate = false): array
    {
        $handler = self::create($integrationType);
        return $isUpdate ? $handler->getUpdateValidationRules() : $handler->getCreateValidationRules();
    }

    /**
     * Get error messages for a specific integration type
     */
    public static function getErrorMessages(IntegrationType $integrationType): array
    {
        $handler = self::create($integrationType);
        return $handler->getErrorMessages();
    }

    /**
     * Get help information for a specific integration type
     */
    public static function getHelpInfo(IntegrationType $integrationType): array
    {
        $handler = self::create($integrationType);
        return $handler->getHelpInfo();
    }
} 