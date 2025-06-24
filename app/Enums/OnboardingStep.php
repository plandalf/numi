<?php

namespace App\Enums;

enum OnboardingStep: int
{
    case PROFILE_SETUP = 1;        // 2^0 = 1
    case FIRST_OFFER = 2;          // 2^1 = 2
    case PAYMENT_SETUP = 4;        // 2^2 = 4
    case THEME_CUSTOMIZATION = 8;  // 2^3 = 8
    case DOMAIN_SETUP = 16;        // 2^4 = 16
    case FIRST_SALE = 32;          // 2^5 = 32
    case TEAM_SETUP = 64;          // 2^6 = 64
    case INTEGRATION_SETUP = 128;  // 2^7 = 128

    /**
     * Get all onboarding steps as an array
     */
    public static function all(): array
    {
        return [
            'profile_setup' => self::PROFILE_SETUP,
            'first_offer' => self::FIRST_OFFER,
            'payment_setup' => self::PAYMENT_SETUP,
            'theme_customization' => self::THEME_CUSTOMIZATION,
            'domain_setup' => self::DOMAIN_SETUP,
            'first_sale' => self::FIRST_SALE,
            'team_setup' => self::TEAM_SETUP,
            'integration_setup' => self::INTEGRATION_SETUP,
        ];
    }

    /**
     * Get the display name for the onboarding step
     */
    public function label(): string
    {
        return match($this) {
            self::PROFILE_SETUP => 'Profile Setup',
            self::FIRST_OFFER => 'Create First Offer',
            self::PAYMENT_SETUP => 'Payment Setup',
            self::THEME_CUSTOMIZATION => 'Theme Customization',
            self::DOMAIN_SETUP => 'Domain Setup',
            self::FIRST_SALE => 'First Sale',
            self::TEAM_SETUP => 'Team Setup',
            self::INTEGRATION_SETUP => 'Integration Setup',
        };
    }

    /**
     * Get the description for the onboarding step
     */
    public function description(): string
    {
        return match($this) {
            self::PROFILE_SETUP => 'Complete your organization profile and basic settings',
            self::FIRST_OFFER => 'Create your first offer to start selling',
            self::PAYMENT_SETUP => 'Configure payment processing and billing',
            self::THEME_CUSTOMIZATION => 'Customize your checkout theme and branding',
            self::DOMAIN_SETUP => 'Set up your custom domain',
            self::FIRST_SALE => 'Make your first sale',
            self::TEAM_SETUP => 'Invite team members to your organization',
            self::INTEGRATION_SETUP => 'Connect external services and integrations',
        };
    }

    /**
     * Get the snake_case name for the step
     */
    public function key(): string
    {
        return match($this) {
            self::PROFILE_SETUP => 'profile_setup',
            self::FIRST_OFFER => 'first_offer',
            self::PAYMENT_SETUP => 'payment_setup',
            self::THEME_CUSTOMIZATION => 'theme_customization',
            self::DOMAIN_SETUP => 'domain_setup',
            self::FIRST_SALE => 'first_sale',
            self::TEAM_SETUP => 'team_setup',
            self::INTEGRATION_SETUP => 'integration_setup',
        };
    }

    /**
     * Get step by key name
     */
    public static function fromKey(string $key): ?self
    {
        return match($key) {
            'profile_setup' => self::PROFILE_SETUP,
            'first_offer' => self::FIRST_OFFER,
            'payment_setup' => self::PAYMENT_SETUP,
            'theme_customization' => self::THEME_CUSTOMIZATION,
            'domain_setup' => self::DOMAIN_SETUP,
            'first_sale' => self::FIRST_SALE,
            'team_setup' => self::TEAM_SETUP,
            'integration_setup' => self::INTEGRATION_SETUP,
            default => null,
        };
    }
}
