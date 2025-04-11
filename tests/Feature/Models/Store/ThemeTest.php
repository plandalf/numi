<?php

namespace Tests\Feature\Models\Store;

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
        $organization = Organization::factory()->create();
        $theme = Theme::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $this->assertNotNull($theme->id);
        $this->assertEquals($organization->id, $theme->organization_id);
        
        // Verify default properties are set
        $this->assertNotNull($theme->color_components_primary_color);
        $this->assertNotNull($theme->typography_main_font);
        $this->assertNotNull($theme->components_border_radius);
    }

    /** @test */
    public function it_returns_theme_properties_as_theme_properties_instance()
    {
        $theme = Theme::factory()->create();
        $properties = $theme->getThemeProperties();

        $this->assertInstanceOf(ThemeProperties::class, $properties);
        $this->assertIsArray($properties->toArray());
    }

    /** @test */
    public function it_can_set_theme_properties_from_theme_properties_instance()
    {
        $theme = Theme::factory()->create();
        
        $customProperties = ThemeProperties::fromArray([
            'color' => [
                'components' => [
                    'primary_color' => '#FF0000',
                    'secondary_color' => '#00FF00',
                ],
                'text' => [
                    'light_text' => '#FFFFFF',
                    'dark_text' => '#000000',
                ],
            ],
            'typography' => [
                'main_font' => 'Arial',
                'mono_font' => 'Courier New',
            ],
            'components' => [
                'border_radius' => '1rem',
                'shadow_sm' => '0 1px 2px rgba(0,0,0,0.1)',
            ],
        ]);

        $theme->setThemeProperties($customProperties);
        $theme->save();

        $this->assertEquals('#FF0000', $theme->color_components_primary_color);
        $this->assertEquals('#00FF00', $theme->color_components_secondary_color);
        $this->assertEquals('#FFFFFF', $theme->color_text_light_text);
        $this->assertEquals('#000000', $theme->color_text_dark_text);
        $this->assertEquals('Arial', $theme->typography_main_font);
        $this->assertEquals('Courier New', $theme->typography_mono_font);
        $this->assertEquals('1rem', $theme->components_border_radius);
        $this->assertEquals('0 1px 2px rgba(0,0,0,0.1)', $theme->components_shadow_sm);
    }

    /** @test */
    public function it_has_valid_color_property_structure()
    {
        $theme = Theme::factory()->create();
        $properties = $theme->getThemeProperties()->toArray();

        $this->assertArrayHasKey('color', $properties);
        $this->assertArrayHasKey('components', $properties['color']);
        $this->assertArrayHasKey('text', $properties['color']);
        $this->assertArrayHasKey('status', $properties['color']);

        // Check components
        $this->assertArrayHasKey('primary_color', $properties['color']['components']);
        $this->assertArrayHasKey('secondary_color', $properties['color']['components']);
        $this->assertArrayHasKey('canvas', $properties['color']['components']);
        $this->assertArrayHasKey('primary_surface', $properties['color']['components']);
        $this->assertArrayHasKey('secondary_surface', $properties['color']['components']);
        $this->assertArrayHasKey('primary_border', $properties['color']['components']);
        $this->assertArrayHasKey('secondary_border', $properties['color']['components']);

        // Check text
        $this->assertArrayHasKey('light_text', $properties['color']['text']);
        $this->assertArrayHasKey('dark_text', $properties['color']['text']);

        // Check status
        $this->assertArrayHasKey('danger', $properties['color']['status']);
        $this->assertArrayHasKey('info', $properties['color']['status']);
        $this->assertArrayHasKey('warning', $properties['color']['status']);
        $this->assertArrayHasKey('success', $properties['color']['status']);
        $this->assertArrayHasKey('highlight', $properties['color']['status']);
    }

    /** @test */
    public function it_has_valid_typography_property_structure()
    {
        $theme = Theme::factory()->create();
        $properties = $theme->getThemeProperties()->toArray();

        $this->assertArrayHasKey('typography', $properties);
        
        // Check main fonts
        $this->assertArrayHasKey('main_font', $properties['typography']);
        $this->assertArrayHasKey('mono_font', $properties['typography']);

        // Check headings
        for ($i = 1; $i <= 6; $i++) {
            $this->assertArrayHasKey("h{$i}", $properties['typography']);
            $this->assertArrayHasKey('size', $properties['typography']["h{$i}"]);
            $this->assertArrayHasKey('font', $properties['typography']["h{$i}"]);
            $this->assertArrayHasKey('weight', $properties['typography']["h{$i}"]);
        }

        // Check label and body
        $this->assertArrayHasKey('label', $properties['typography']);
        $this->assertArrayHasKey('body', $properties['typography']);

        foreach (['label', 'body'] as $type) {
            $this->assertArrayHasKey('size', $properties['typography'][$type]);
            $this->assertArrayHasKey('font', $properties['typography'][$type]);
            $this->assertArrayHasKey('weight', $properties['typography'][$type]);
        }
    }

    /** @test */
    public function it_has_valid_components_property_structure()
    {
        $theme = Theme::factory()->create();
        $properties = $theme->getThemeProperties()->toArray();

        $this->assertArrayHasKey('components', $properties);
        $this->assertArrayHasKey('border_radius', $properties['components']);
        $this->assertArrayHasKey('shadow_sm', $properties['components']);
        $this->assertArrayHasKey('shadow_md', $properties['components']);
        $this->assertArrayHasKey('shadow_lg', $properties['components']);
    }

    /** @test */
    public function it_validates_color_property_values_types()
    {
        $theme = Theme::factory()->create();
        $properties = $theme->getThemeProperties()->toArray();

        // Check color components
        foreach ($properties['color']['components'] as $value) {
            $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $value);
        }

        // Check color text
        foreach ($properties['color']['text'] as $value) {
            $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $value);
        }

        // Check color status
        foreach ($properties['color']['status'] as $value) {
            $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $value);
        }
    }

    /** @test */
    public function it_validates_typography_property_value_types()
    {
        $theme = Theme::factory()->create();
        $properties = $theme->getThemeProperties()->toArray();

        // Check main fonts
        $this->assertIsString($properties['typography']['main_font']);
        $this->assertIsString($properties['typography']['mono_font']);

        // Check headings
        for ($i = 1; $i <= 6; $i++) {
            $this->assertIsString($properties['typography']["h{$i}"]['size']);
            $this->assertIsString($properties['typography']["h{$i}"]['font']);
            $this->assertIsString($properties['typography']["h{$i}"]['weight']);
        }

        // Check label and body
        foreach (['label', 'body'] as $type) {
            $this->assertIsString($properties['typography'][$type]['size']);
            $this->assertIsString($properties['typography'][$type]['font']);
            $this->assertIsString($properties['typography'][$type]['weight']);
        }
    }

    /** @test */
    public function it_validates_components_property_value_types()
    {
        $theme = Theme::factory()->create();
        $properties = $theme->getThemeProperties()->toArray();

        $this->assertIsString($properties['components']['border_radius']);
        $this->assertIsString($properties['components']['shadow_sm']);
        $this->assertIsString($properties['components']['shadow_md']);
        $this->assertIsString($properties['components']['shadow_lg']);
    }

    /** @test */
    public function it_validates_theme_properties_against_property_structure()
    {
        $theme = Theme::factory()->create();
        
        // Create custom properties with some missing fields
        $customProperties = ThemeProperties::fromArray([
            'color' => [
                'components' => [
                    'primary_color' => '#FF0000',
                ],
            ],
            'typography' => [
                'main_font' => 'Arial',
            ],
        ]);

        $theme->setThemeProperties($customProperties);
        $theme->save();

        // Get the properties back
        $properties = $theme->getThemeProperties()->toArray();

        // Verify custom properties were set
        $this->assertEquals('#FF0000', $properties['color']['components']['primary_color']);
        $this->assertEquals('Arial', $properties['typography']['main_font']);

        // Verify default properties exist for unspecified fields
        $this->assertNotNull($properties['color']['components']['secondary_color']);
        $this->assertNotNull($properties['typography']['mono_font']);
        $this->assertNotNull($properties['components']['border_radius']);
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
