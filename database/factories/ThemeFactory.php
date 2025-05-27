<?php

namespace Database\Factories;

use App\Enums\Theme\FontElement;
use App\Http\Resources\ThemeResource;
use App\Models\Organization;
use App\Models\Theme;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Theme>
 */
class ThemeFactory extends Factory
{
    protected $model = Theme::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fontFamilyElements = FontElement::values();

        $mainFont = $this->faker->randomElement($fontFamilyElements);
        $monoFont = $this->faker->randomElement($fontFamilyElements);

        return [
            'organization_id' => null,
            'name' => $this->faker->word(),

            'primary_color' => $this->faker->hexColor(),
            'primary_contrast_color' => $this->faker->hexColor(),

            'secondary_color' => $this->faker->hexColor(),
            'secondary_contrast_color' => $this->faker->hexColor(),

            'canvas_color' => $this->faker->hexColor(),
            'primary_surface_color' => $this->faker->hexColor(),
            'secondary_surface_color' => $this->faker->hexColor(),

            'label_text_color' => $this->faker->hexColor(),
            'body_text_color' => $this->faker->hexColor(),

            'primary_border_color' => $this->faker->hexColor(),
            'secondary_border_color' => $this->faker->hexColor(),

            'warning_color' => $this->faker->hexColor(),
            'success_color' => $this->faker->hexColor(),
            'highlight_color' => $this->faker->hexColor(),

            'main_font' => $mainFont,
            'mono_font' => $monoFont,
            
            'h1_typography' => [
                ...ThemeResource::getDefaultValues('h1_typography'),
                'font' => $mainFont,
            ],
            'h2_typography' => [
                ...ThemeResource::getDefaultValues('h2_typography'),
                'font' => $mainFont,
            ],
            'h3_typography' => [
                ...ThemeResource::getDefaultValues('h3_typography'),
                'font' => $mainFont,
            ],
            'h4_typography' => [
                ...ThemeResource::getDefaultValues('h4_typography'),
                'font' => $mainFont,
            ],
            'h5_typography' => [
                ...ThemeResource::getDefaultValues('h5_typography'),
                'font' => $mainFont,
            ],

            'label_typography' => [
                ...ThemeResource::getDefaultValues('label_typography'),
                'font' => $mainFont,
            ],

            'body_typography' => [
                ...ThemeResource::getDefaultValues('body_typography'),
                'font' => $mainFont,
            ],

            'border_radius' => ThemeResource::getDefaultValues('border_radius'),
            'shadow' => ThemeResource::getDefaultValues('shadow'),

            'padding' => ThemeResource::getDefaultValues('padding'),
            'spacing' => ThemeResource::getDefaultValues('spacing'),
            'margin' => ThemeResource::getDefaultValues('margin'),
        ];
    }

    /**
     * Indicate that the theme belongs to an organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }
}
