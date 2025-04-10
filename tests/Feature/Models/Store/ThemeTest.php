<?php

namespace Tests\Feature\Models\Store;

use App\Enums\Theme\Color\ColorComponentType;
use App\Enums\Theme\Color\ColorPropertyType;
use App\Enums\Theme\Color\ColorStatusType;
use App\Enums\Theme\Color\ColorTextType;
use App\Enums\Theme\Component\ComponentPropertyType;
use App\Enums\Theme\ElementType;
use App\Enums\Theme\ThemeFieldType;
use App\Enums\Theme\Typography\TypographyElementType;
use App\Enums\Theme\Typography\TypographyPropertyType;
use App\Models\Organization;
use App\Models\Store\Theme;
use App\Models\Store\ThemeProperties;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemeTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_theme_with_default_properties()
    {
        // Create an organization for the theme
        $organization = Organization::factory()->create();
        
        // Create a theme with default properties
        $theme = Theme::factory()->create([
            'organization_id' => $organization->id,
        ]);
        
        // Assert the theme was created
        $this->assertDatabaseHas('store_themes', [
            'id' => $theme->id,
            'organization_id' => $organization->id,
        ]);
        
        // Assert theme properties were set with defaults
        $this->assertNotNull($theme->color);
        $this->assertNotNull($theme->typography);
        $this->assertNotNull($theme->components);
    }

    /** @test */
    public function it_returns_theme_properties_as_theme_properties_instance()
    {
        $theme = Theme::factory()->create();
        
        $themeProperties = $theme->getThemeProperties();
        
        $this->assertInstanceOf(ThemeProperties::class, $themeProperties);
        $this->assertEquals($theme->color, $themeProperties->toArray()['color']);
        $this->assertEquals($theme->typography, $themeProperties->toArray()['typography']);
        $this->assertEquals($theme->components, $themeProperties->toArray()['components']);
    }

    /** @test */
    public function it_can_set_theme_properties_from_theme_properties_instance()
    {
        $theme = Theme::factory()->create();
        
        // Create custom theme properties
        $customProperties = [
            'color' => [
                ColorPropertyType::COMPONENTS->value => [
                    ColorComponentType::PRIMARY_COLOR->value => '#ff0000',
                ],
            ],
        ];
        
        $themeProperties = ThemeProperties::fromArray($customProperties);
        
        // Set the custom properties
        $theme->setThemeProperties($themeProperties);
        $theme->save();
        
        // Reload the theme from the database
        $theme->refresh();
        
        // Assert the properties were saved
        $this->assertEquals('#ff0000', $theme->color[ColorPropertyType::COMPONENTS->value][ColorComponentType::PRIMARY_COLOR->value]);
    }

    /** @test */
    public function it_has_valid_color_property_structure()
    {
        $theme = Theme::factory()->create();
        $themeProperties = $theme->getThemeProperties();
        $color = $themeProperties->properties[ThemeFieldType::COLOR->value];
        
        // Verify components exist in color
        $this->assertArrayHasKey(ColorPropertyType::COMPONENTS->value, $color);
        $this->assertArrayHasKey(ColorPropertyType::TEXT->value, $color);
        $this->assertArrayHasKey(ColorPropertyType::STATUS->value, $color);
        
        // Verify color components
        $components = $color[ColorPropertyType::COMPONENTS->value];
        $this->assertArrayHasKey(ColorComponentType::PRIMARY_COLOR->value, $components);
        $this->assertArrayHasKey(ColorComponentType::SECONDARY_COLOR->value, $components);
        $this->assertArrayHasKey(ColorComponentType::CANVAS->value, $components);
        $this->assertArrayHasKey(ColorComponentType::PRIMARY_SURFACE->value, $components);
        $this->assertArrayHasKey(ColorComponentType::SECONDARY_SURFACE->value, $components);
        $this->assertArrayHasKey(ColorComponentType::PRIMARY_BORDER->value, $components);
        $this->assertArrayHasKey(ColorComponentType::SECONDARY_BORDER->value, $components);
        
        // Verify text colors
        $text = $color[ColorPropertyType::TEXT->value];
        $this->assertArrayHasKey(ColorTextType::LIGHT_TEXT->value, $text);
        $this->assertArrayHasKey(ColorTextType::DARK_TEXT->value, $text);
        
        // Verify status colors
        $status = $color[ColorPropertyType::STATUS->value];
        $this->assertArrayHasKey(ColorStatusType::DANGER->value, $status);
        $this->assertArrayHasKey(ColorStatusType::INFO->value, $status);
        $this->assertArrayHasKey(ColorStatusType::WARNING->value, $status);
        $this->assertArrayHasKey(ColorStatusType::SUCCESS->value, $status);
        $this->assertArrayHasKey(ColorStatusType::HIGHLIGHT->value, $status);
    }
    
    /** @test */
    public function it_has_valid_typography_property_structure()
    {
        $theme = Theme::factory()->create();
        $themeProperties = $theme->getThemeProperties();
        $typography = $themeProperties->properties[ThemeFieldType::TYPOGRAPHY->value];
        
        // Verify main font properties
        $this->assertArrayHasKey(TypographyPropertyType::MAIN_FONT->value, $typography);
        $this->assertArrayHasKey(TypographyPropertyType::MONO_FONT->value, $typography);
        
        // Verify heading properties
        $this->assertArrayHasKey(TypographyPropertyType::H1->value, $typography);
        $this->assertArrayHasKey(TypographyPropertyType::H2->value, $typography);
        $this->assertArrayHasKey(TypographyPropertyType::H3->value, $typography);
        $this->assertArrayHasKey(TypographyPropertyType::H4->value, $typography);
        $this->assertArrayHasKey(TypographyPropertyType::H5->value, $typography);
        $this->assertArrayHasKey(TypographyPropertyType::H6->value, $typography);
        
        // Verify text properties
        $this->assertArrayHasKey(TypographyPropertyType::LABEL->value, $typography);
        $this->assertArrayHasKey(TypographyPropertyType::BODY->value, $typography);
        
        // Check structure of h1 (as an example)
        $h1 = $typography[TypographyPropertyType::H1->value];
        $this->assertArrayHasKey(TypographyElementType::SIZE->value, $h1);
        $this->assertArrayHasKey(TypographyElementType::FONT->value, $h1);
        $this->assertArrayHasKey(TypographyElementType::WEIGHT->value, $h1);
    }
    
    /** @test */
    public function it_has_valid_components_property_structure()
    {
        $theme = Theme::factory()->create();
        $themeProperties = $theme->getThemeProperties();
        $components = $themeProperties->properties[ThemeFieldType::COMPONENTS->value];
        
        // Verify component properties
        $this->assertArrayHasKey(ComponentPropertyType::BORDER_RADIUS->value, $components);
        $this->assertArrayHasKey(ComponentPropertyType::SHADOW_SM->value, $components);
        $this->assertArrayHasKey(ComponentPropertyType::SHADOW_MD->value, $components);
        $this->assertArrayHasKey(ComponentPropertyType::SHADOW_LG->value, $components);
    }
    
    /** @test */
    public function it_validates_color_property_values_types()
    {
        $theme = Theme::factory()->create();
        $themeProperties = $theme->getThemeProperties();
        $color = $themeProperties->properties[ThemeFieldType::COLOR->value];
        
        // Check types for component colors (should be hex values)
        foreach ($color[ColorPropertyType::COMPONENTS->value] as $colorValue) {
            $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/i', $colorValue);
        }
        
        // Check types for text colors
        foreach ($color[ColorPropertyType::TEXT->value] as $colorValue) {
            $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/i', $colorValue);
        }
        
        // Check types for status colors
        foreach ($color[ColorPropertyType::STATUS->value] as $colorValue) {
            $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/i', $colorValue);
        }
    }
    
    /** @test */
    public function it_validates_typography_property_value_types()
    {
        $theme = Theme::factory()->create();
        $themeProperties = $theme->getThemeProperties();
        $typography = $themeProperties->properties[ThemeFieldType::TYPOGRAPHY->value];
        
        // Check font types
        $this->assertIsString($typography[TypographyPropertyType::MAIN_FONT->value]);
        $this->assertIsString($typography[TypographyPropertyType::MONO_FONT->value]);
        
        // Check heading structures (using h1 as example)
        $h1 = $typography[TypographyPropertyType::H1->value];
        $this->assertIsString($h1[TypographyElementType::SIZE->value]);
        $this->assertIsString($h1[TypographyElementType::FONT->value]);
        $this->assertIsString($h1[TypographyElementType::WEIGHT->value]);
        
        // Validate rem values for sizes
        $this->assertMatchesRegularExpression('/^\d+(\.\d+)?rem$/', $h1[TypographyElementType::SIZE->value]);
    }
    
    /** @test */
    public function it_validates_components_property_value_types()
    {
        $theme = Theme::factory()->create();
        $themeProperties = $theme->getThemeProperties();
        $components = $themeProperties->properties[ThemeFieldType::COMPONENTS->value];
        
        // Border radius should be rem size
        $this->assertMatchesRegularExpression('/^\d+(\.\d+)?rem$/', $components[ComponentPropertyType::BORDER_RADIUS->value]);
        
        // Shadows should be CSS shadow values
        $this->assertIsString($components[ComponentPropertyType::SHADOW_SM->value]);
        $this->assertIsString($components[ComponentPropertyType::SHADOW_MD->value]);
        $this->assertIsString($components[ComponentPropertyType::SHADOW_LG->value]);
    }
    
    /** @test */
    public function it_validates_theme_properties_against_property_structure()
    {
        // Create a theme with custom properties
        $customProperties = [
            'color' => [
                ColorPropertyType::COMPONENTS->value => [
                    ColorComponentType::PRIMARY_COLOR->value => '#ff0000',
                    ColorComponentType::SECONDARY_COLOR->value => '#00ff00',
                ],
                ColorPropertyType::TEXT->value => [
                    ColorTextType::LIGHT_TEXT->value => '#ffffff',
                ],
            ],
        ];
        
        $themeProperties = ThemeProperties::fromArray($customProperties);
        
        // Verify that the properties structure is maintained even with partial custom data
        $this->assertArrayHasKey(ThemeFieldType::COLOR->value, $themeProperties->properties);
        $this->assertArrayHasKey(ThemeFieldType::TYPOGRAPHY->value, $themeProperties->properties);
        $this->assertArrayHasKey(ThemeFieldType::COMPONENTS->value, $themeProperties->properties);
        
        // Verify the custom properties were set
        $color = $themeProperties->properties[ThemeFieldType::COLOR->value];
        $this->assertEquals('#ff0000', $color[ColorPropertyType::COMPONENTS->value][ColorComponentType::PRIMARY_COLOR->value]);
        $this->assertEquals('#00ff00', $color[ColorPropertyType::COMPONENTS->value][ColorComponentType::SECONDARY_COLOR->value]);
        
        // And default properties exist for ones not specified
        $this->assertNotNull($color[ColorPropertyType::COMPONENTS->value][ColorComponentType::CANVAS->value]);
        $this->assertNotNull($color[ColorPropertyType::STATUS->value][ColorStatusType::DANGER->value]);
    }
    
    /** @test */
    public function it_properly_belongs_to_organization()
    {
        $organization = Organization::factory()->create();
        $theme = Theme::factory()->create([
            'organization_id' => $organization->id,
        ]);
        
        $this->assertInstanceOf(Organization::class, $theme->organization);
        $this->assertEquals($organization->id, $theme->organization->id);
    }
}
