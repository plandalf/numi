<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\Template;
use App\Models\Theme;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Template>
 */
class TemplateFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Template::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->paragraph(),
            'category' => $this->faker->randomElement(['checkout', 'landing', 'pricing', 'custom']),
            'theme_id' => Theme::factory(),
            'organization_id' => Organization::factory(),
            'view' => $this->getSampleViewData(),
            'preview_images' => [
                $this->faker->imageUrl(640, 480, 'business'),
                $this->faker->imageUrl(640, 480, 'business'),
            ],
        ];
    }

    /**
     * Get sample view data based on the view-example.json
     */
    private function getSampleViewData(): array
    {
        return [
            'id' => 'view_'.$this->faker->uuid,
            'pages' => [
                'page_1' => [
                    'id' => 'page_1',
                    'name' => 'Sample Page',
                    'type' => 'page',
                    'view' => [
                        'promo' => [
                            'style' => [
                                'backgroundSize' => 'cover',
                                'backgroundImage' => 'url(sample.jpg)',
                                'backgroundRepeat' => 'no-repeat',
                                'backgroundPosition' => 'center',
                            ],
                            'blocks' => [],
                        ],
                        'title' => [
                            'blocks' => [
                                [
                                    'id' => 'text-block-1',
                                    'type' => 'text',
                                    'content' => [
                                        'value' => 'Sample Template',
                                    ],
                                    'object' => 'block',
                                ],
                            ],
                        ],
                        'content' => [
                            'blocks' => [],
                        ],
                    ],
                    'layout' => [
                        'sm' => 'split-checkout@v1',
                    ],
                    'provides' => [
                        'start',
                        'commit',
                    ],
                    'next_page' => [
                        'branches' => [],
                        'default_next_page' => null,
                    ],
                ],
            ],
            'first_page' => 'page_1',
        ];
    }
}
