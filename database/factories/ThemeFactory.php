<?php

namespace Database\Factories;

use App\Enums\Theme\FontElement;
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
            'secondary_color' => $this->faker->hexColor(),
            'canvas_color' => $this->faker->hexColor(),
            'primary_surface_color' => $this->faker->hexColor(),
            'secondary_surface_color' => $this->faker->hexColor(),
            'primary_border_color' => $this->faker->hexColor(),
            'secondary_border_color' => $this->faker->hexColor(),
            'light_text_color' => $this->faker->hexColor(),
            'dark_text_color' => $this->faker->hexColor(),
            'danger_color' => $this->faker->hexColor(),
            'info_color' => $this->faker->hexColor(),
            'warning_color' => $this->faker->hexColor(),
            'success_color' => $this->faker->hexColor(),
            'highlight_color' => $this->faker->hexColor(),
            'main_font' => $mainFont,
            'mono_font' => $monoFont,
            'h1_typography' => ['16px', $mainFont, '700'],
            'h2_typography' => ['14px', $mainFont, '600'],
            'h3_typography' => ['12px', $mainFont, '600'],
            'h4_typography' => ['10px', $mainFont, '500'],
            'h5_typography' => ['8px', $mainFont, '500'],
            'h6_typography' => ['6px', $mainFont, '400'],
            'label_typography' => ['12px', $mainFont, '500'],
            'body_typography' => ['14px', $mainFont, '400'],
            'border_radius' => '4px',
            'shadow_sm' => '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            'shadow_md' => '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            'shadow_lg' => '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            'padding' => '5px 10px 5px 10px',
            'spacing' => '5px 10px 5px 10px',
            'margin' => '5px 10px 5px 10px',
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
