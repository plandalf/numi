<?php

namespace Database\Factories\Store;

use App\Enums\Theme\ElementType;
use App\Models\Organization;
use App\Models\Store\Theme;
use App\Models\Store\ThemeProperties;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Store\Theme>
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
        $fontFamilyElements = [
            'Inter',
            'Roboto',
            'Arial',
            'Helvetica',
            'Verdana',
            'Tahoma',
            'Trebuchet MS',
            'Georgia',
            'Garamond',
            'Times New Roman',
            'Palatino',
            'Bookman',
            'Comic Sans MS',
            'Impact',
        ];

        $mainFont = $this->faker->randomElement($fontFamilyElements);
        $monoFont = $this->faker->randomElement($fontFamilyElements);

        return [
            'organization_id' => Organization::factory(),
            'name' => $this->faker->word(),
            ...$this->generateThemeProperties($mainFont, $monoFont),
        ];
    }

    /**
     * Generate theme properties based on ThemeProperties::PROPERTY_STRUCTURE.
     *
     * @param string $mainFont
     * @param string $monoFont
     * @return array
     */
    private function generateThemeProperties(string $mainFont, string $monoFont): array
    {
        $result = [];

        foreach (ThemeProperties::PROPERTY_STRUCTURE as $field) {
            $name = $field['name'];
            $result[$name] = $this->processField($field, $mainFont, $monoFont);
        }

        return $result;
    }

    /**
     * Process a field in the theme structure recursively.
     *
     * @param array $field
     * @param string $mainFont
     * @param string $monoFont
     * @return mixed
     */
    private function processField(array $field, string $mainFont, string $monoFont): mixed
    {
        if ($field['type']->value == ElementType::OBJECT->value) {
            $result = [];
            foreach ($field['properties'] as $property) {
                $result[$property['name']] = $this->processField($property, $mainFont, $monoFont);
            }
            return $result;
        }

        return match ($field['type']->value) {
            ElementType::COLOR->value => $this->faker->hexColor(),
            ElementType::FONT->value => match ($field['name']) {
                'main_font' => $mainFont,
                'mono_font' => $monoFont,
                default => $mainFont,
            },
            ElementType::SIZE->value => $field['default'],
            ElementType::WEIGHT->value => $field['default'],
            ElementType::SHADOW->value => $field['default'],
            default => '',
        };
    }
}
