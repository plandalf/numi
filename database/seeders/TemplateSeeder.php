<?php

namespace Database\Seeders;

use App\Models\Template;
use App\Models\Theme;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    private const PREVIEW_IMAGES = [
        'preview-1' => 'assets/sample-preview-images/1.png',
        'preview-2' => 'assets/sample-preview-images/2.png',
        'preview-3' => 'assets/sample-preview-images/3.png',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create three templates with different themes
        $this->createBasicCheckoutTemplate();
        $this->createPremiumCheckoutTemplate();
        $this->createEnterpriseCheckoutTemplate();
    }

    private function createBasicCheckoutTemplate(): void
    {
        $theme = Theme::factory()->create();

        Template::create([
            'name' => 'Basic Checkout Flow',
            'description' => 'A simple, streamlined checkout process perfect for small to medium businesses. Features a clean, single-page design that guides customers through payment with minimal friction.',
            'category' => 'Basic',
            'theme_id' => $theme->id,
            'preview_images' => [
                self::PREVIEW_IMAGES['preview-1'],
                self::PREVIEW_IMAGES['preview-2'],
            ],
            'view' => [
                'id' => 'view_basic_checkout',
                'pages' => [
                    'page_entry' => [
                        'id' => 'page_entry',
                        'name' => 'Entry Page',
                        'type' => 'entry',
                        'view' => [
                            'promo' => [
                                'style' => [
                                    'backgroundSize' => 'cover',
                                    'backgroundImage' => 'url(saruman.jpg)',
                                    'backgroundRepeat' => 'no-repeat',
                                    'backgroundPosition' => 'center',
                                ],
                                'blocks' => [
                                    [
                                        'id' => 'text-block-1',
                                        'type' => 'text',
                                        'content' => [
                                            'value' => 'Start Your Journey',
                                        ],
                                        'object' => 'block',
                                    ],
                                ],
                            ],
                            'content' => [
                                'blocks' => [
                                    [
                                        'id' => 'checkout-form',
                                        'type' => 'checkout_form',
                                        'object' => 'block',
                                    ],
                                ],
                            ],
                        ],
                        'layout' => [
                            'sm' => 'split-checkout@v1',
                        ],
                    ],
                ],
                'first_page' => 'page_entry',
            ],
        ]);
    }

    private function createPremiumCheckoutTemplate(): void
    {
        $theme = Theme::factory()->create();

        Template::create([
            'name' => 'Premium Multi-step Checkout',
            'description' => 'An enhanced checkout experience with multiple steps and progress tracking. Includes upsell opportunities, saved payment methods, and a seamless mobile experience.',
            'category' => 'Multi-step',
            'theme_id' => $theme->id,
            'preview_images' => [
                self::PREVIEW_IMAGES['preview-1'],
                self::PREVIEW_IMAGES['preview-2'],
                self::PREVIEW_IMAGES['preview-3'],
            ],
            'view' => [
                'id' => 'view_premium_checkout',
                'pages' => [
                    'page_welcome' => [
                        'id' => 'page_welcome',
                        'name' => 'Welcome',
                        'type' => 'entry',
                        'view' => [
                            'promo' => [
                                'style' => [
                                    'backgroundSize' => 'cover',
                                    'backgroundImage' => 'url(ugluk.jpg)',
                                    'backgroundRepeat' => 'no-repeat',
                                    'backgroundPosition' => 'center',
                                ],
                            ],
                            'content' => [
                                'blocks' => [
                                    [
                                        'id' => 'welcome-message',
                                        'type' => 'text',
                                        'content' => [
                                            'value' => 'Welcome to Premium Checkout',
                                        ],
                                        'object' => 'block',
                                    ],
                                ],
                            ],
                        ],
                        'layout' => [
                            'sm' => 'split-checkout@v1',
                        ],
                        'next_page' => [
                            'default_next_page' => 'page_payment',
                        ],
                    ],
                ],
                'first_page' => 'page_welcome',
            ],
        ]);
    }

    private function createEnterpriseCheckoutTemplate(): void
    {
        $theme = Theme::factory()->create();

        Template::create([
            'name' => 'Enterprise Checkout Solution',
            'description' => 'A comprehensive checkout solution for large businesses. Features advanced security, analytics integration, customizable workflows, and support for multiple payment providers.',
            'category' => 'Enterprise',
            'theme_id' => $theme->id,
            'preview_images' => [
                self::PREVIEW_IMAGES['preview-1'],
            ],
            'view' => [
                'id' => 'view_enterprise_checkout',
                'pages' => [
                    'page_main' => [
                        'id' => 'page_main',
                        'name' => 'Main Page',
                        'type' => 'page',
                        'view' => [
                            'promo' => [
                                'style' => [
                                    'backgroundSize' => 'cover',
                                    'backgroundImage' => 'url(happy-saruman.jpg)',
                                    'backgroundRepeat' => 'no-repeat',
                                    'backgroundPosition' => 'center',
                                ],
                            ],
                            'content' => [
                                'blocks' => [
                                    [
                                        'id' => 'enterprise-form',
                                        'type' => 'enterprise_checkout_form',
                                        'object' => 'block',
                                    ],
                                    [
                                        'id' => 'features-list',
                                        'type' => 'detail_list',
                                        'object' => 'block',
                                        'content' => [
                                            'items' => [
                                                [
                                                    'key' => 'feature-1',
                                                    'label' => 'Enterprise Grade Security',
                                                    'prefixIcon' => 'shield',
                                                    'caption' => 'Bank-level security for your transactions',
                                                ],
                                                [
                                                    'key' => 'feature-2',
                                                    'label' => 'Advanced Analytics',
                                                    'prefixIcon' => 'chart',
                                                    'caption' => 'Detailed insights into your business',
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'layout' => [
                            'sm' => 'split-checkout@v1',
                        ],
                    ],
                ],
                'first_page' => 'page_main',
            ],
        ]);
    }
}
