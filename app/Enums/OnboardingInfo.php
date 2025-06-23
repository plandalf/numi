<?php

namespace App\Enums;

enum OnboardingInfo: int
{
    case DASHBOARD_INTRO = 1;      // 2^0 = 1 - Introduction to the dashboard
    case OFFERS_TUTORIAL = 2;      // 2^1 = 2 - Offers tutorial video
    case TEMPLATES_INTRO = 4;      // 2^2 = 4 - Introduction to templates
    case ANALYTICS_TOUR = 8;       // 2^3 = 8 - Analytics and reporting tour
    case BILLING_INTRO = 16;       // 2^4 = 16 - Billing and subscription intro
    case PRODUCTS_TUTORIAL = 32;   // 2^5 = 32 - Products tutorial

    /**
     * Get all informational onboarding items as an array
     */
    public static function all(): array
    {
        return [
            'dashboard_intro' => self::DASHBOARD_INTRO,
            'offers_tutorial' => self::OFFERS_TUTORIAL,
            'templates_intro' => self::TEMPLATES_INTRO,
            'analytics_tour' => self::ANALYTICS_TOUR,
            'billing_intro' => self::BILLING_INTRO,
            'products_tutorial' => self::PRODUCTS_TUTORIAL,
        ];
    }

    /**
     * Get the display name for the informational item
     */
    public function label(): string
    {
        return match($this) {
            self::DASHBOARD_INTRO => 'Dashboard Introduction',
            self::OFFERS_TUTORIAL => 'Offers Tutorial',
            self::TEMPLATES_INTRO => 'Templates Introduction', 
            self::ANALYTICS_TOUR => 'Analytics Tour',
            self::BILLING_INTRO => 'Billing Introduction',
            self::PRODUCTS_TUTORIAL => 'Products Tutorial',
        };
    }

    /**
     * Get the description for the informational item
     */
    public function description(): string
    {
        return match($this) {
            self::DASHBOARD_INTRO => 'Learn about the main features and navigation',
            self::OFFERS_TUTORIAL => 'Watch the tutorial on creating effective offers',
            self::TEMPLATES_INTRO => 'Discover how to use and customize templates',
            self::ANALYTICS_TOUR => 'Understand your performance metrics and reports',
            self::BILLING_INTRO => 'Learn about pricing, billing, and subscription management',
            self::PRODUCTS_TUTORIAL => 'Learn how to create and manage products',
        };
    }

    /**
     * Get the snake_case name for the item
     */
    public function key(): string
    {
        return match($this) {
            self::DASHBOARD_INTRO => 'dashboard_intro',
            self::OFFERS_TUTORIAL => 'offers_tutorial',
            self::TEMPLATES_INTRO => 'templates_intro',
            self::ANALYTICS_TOUR => 'analytics_tour',
            self::BILLING_INTRO => 'billing_intro',
            self::PRODUCTS_TUTORIAL => 'products_tutorial',
        };
    }

    /**
     * Get item by key name
     */
    public static function fromKey(string $key): ?self
    {
        return match($key) {
            'dashboard_intro' => self::DASHBOARD_INTRO,
            'offers_tutorial' => self::OFFERS_TUTORIAL,
            'templates_intro' => self::TEMPLATES_INTRO,
            'analytics_tour' => self::ANALYTICS_TOUR,
            'billing_intro' => self::BILLING_INTRO,
            'products_tutorial' => self::PRODUCTS_TUTORIAL,
            default => null,
        };
    }
}
