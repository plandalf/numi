<?php

namespace Database\Factories\Store;

use App\Enums\Theme\Element;
use App\Enums\Theme\FontElement;
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
        $fontFamilyElements = FontElement::values();

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
            $this->processField($result, $field, $mainFont, $monoFont);
        }

        return $result;
    }

    /**
     * Process a field in the theme structure recursively.
     *
     * @param array $result The result array to fill
     * @param array $field The field structure to process
     * @param string $mainFont The main font to use
     * @param string $monoFont The mono font to use
     * @return void
     */
    private function processField(array &$result, array $field, string $mainFont, string $monoFont): void
    {
        if ($field['type'] === Element::OBJECT) {
            foreach ($field['properties'] as $property) {
                $this->processField($result, $property, $mainFont, $monoFont);
            }
            return;
        }

        $dbKey = $field['db_key'];
        
        $result[$dbKey] = match ($field['type']->value) {
            Element::COLOR->value => $this->faker->hexColor(),
            Element::FONT->value => match ($field['name']) {
                'main_font' => $mainFont,
                'mono_font' => $monoFont,
                default => $mainFont,
            },
            Element::SIZE->value => $field['default'],
            Element::WEIGHT->value => $field['default'],
            Element::SHADOW->value => $field['default'],
            default => '',
        };
    }
}
