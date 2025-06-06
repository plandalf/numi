<?php

namespace Tests\Feature\Models;

use App\Models\Organization;
use App\Models\Theme;
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
        $this->assertNotNull($theme->primary_color);
        $this->assertNotNull($theme->main_font);
        $this->assertNotNull($theme->border_radius);
    }

    /** @test */
    public function it_can_create_global_themes()
    {
        // Create a global theme (no organization)
        $globalTheme = Theme::factory()->create();

        $this->assertNull($globalTheme->organization_id);
        $this->assertNull($globalTheme->organization);
    }

    /** @test */
    public function it_can_scope_global_themes()
    {
        // Create mix of global and organization themes
        $organization = Organization::factory()->create();

        // Create 2 global themes
        Theme::factory()->count(2)->create();

        // Create 3 organization themes
        Theme::factory()
            ->count(3)
            ->forOrganization($organization)
            ->create();

        // Test global scope
        $globalThemes = Theme::global()->get();

        $this->assertCount(2, $globalThemes);
        $globalThemes->each(function ($theme) {
            $this->assertNull($theme->organization_id);
        });
    }

    /** @test */
    public function it_can_update_theme_properties()
    {
        $theme = Theme::factory()->create();

        $theme->fill([
            'primary_color' => '#FF0000',
            'secondary_color' => '#00FF00',
            'main_font' => 'Arial',
            'mono_font' => 'Courier New',
            'border_radius' => '4px',
            'shadow' => '0 1px 2px rgba(0,0,0,0.1)',
            'h1_typography' => [
                'size' => '32px',
                'font' => 'Montserrat',
                'weight' => '600',
                'color' => '#972626FF',
                'letterSpacing' => '0px',
                'lineHeight' => '1.1'
            ],
            'h2_typography' => [
                'size' => '28px',
                'font' => 'Montserrat',
                'weight' => '600',
                'color' => '#972626FF',
                'letterSpacing' => '0px',
                'lineHeight' => '1.1'
            ],
            'body_typography' => [
                'size' => '16px',
                'font' => 'Montserrat',
                'weight' => '400',
                'color' => '#972626FF',
                'letterSpacing' => '0px',
                'lineHeight' => '1.1'
            ],
        ]);

        $theme->save();

        $this->assertEquals('#FF0000', $theme->primary_color);
        $this->assertEquals('#00FF00', $theme->secondary_color);
        $this->assertEquals('Arial', $theme->main_font);
        $this->assertEquals('Courier New', $theme->mono_font);
        $this->assertEquals('4px', $theme->border_radius);
        $this->assertEquals('0 1px 2px rgba(0,0,0,0.1)', $theme->shadow);
        $this->assertEquals([
            'size' => '32px',
            'font' => 'Montserrat',
            'weight' => '600',
            'color' => '#972626FF',
            'letterSpacing' => '0px',
            'lineHeight' => '1.1'
        ], $theme->h1_typography);
        $this->assertEquals([
            'size' => '28px',
            'font' => 'Montserrat',
            'weight' => '600',
            'color' => '#972626FF',
            'letterSpacing' => '0px',
            'lineHeight' => '1.1'
        ], $theme->h2_typography);
        $this->assertEquals([
            'size' => '16px',
            'font' => 'Montserrat',
            'weight' => '400',
            'color' => '#972626FF',
            'letterSpacing' => '0px',
            'lineHeight' => '1.1'
        ], $theme->body_typography);
    }

    /** @test */
    public function it_validates_color_property_values_types()
    {
        $theme = Theme::factory()->create();

        // Colors should be 6 characters (hex without alpha)
        $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $theme->primary_color);
        $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $theme->secondary_color);
    }

    /** @test */
    public function it_validates_typography_property_value_types()
    {
        $theme = Theme::factory()->create();

        // Fonts should be strings
        $this->assertIsString($theme->main_font);
        $this->assertIsString($theme->mono_font);

        // Typography should be arrays containing specific keys
        $this->assertIsArray($theme->h1_typography);
        $this->assertArrayHasKey('size', $theme->h1_typography);
        $this->assertArrayHasKey('font', $theme->h1_typography);
        $this->assertArrayHasKey('weight', $theme->h1_typography);
        $this->assertArrayHasKey('color', $theme->h1_typography);
        $this->assertArrayHasKey('letterSpacing', $theme->h1_typography);
        $this->assertArrayHasKey('lineHeight', $theme->h1_typography);

        // Validate types of typography properties
        $this->assertIsString($theme->h1_typography['size']);
        $this->assertIsString($theme->h1_typography['font']);
        $this->assertIsString($theme->h1_typography['weight']);
        $this->assertIsString($theme->h1_typography['color']);
        $this->assertIsString($theme->h1_typography['letterSpacing']);
        $this->assertIsString($theme->h1_typography['lineHeight']);

        // Test body typography as well
        $this->assertIsArray($theme->body_typography);
        $this->assertArrayHasKey('size', $theme->body_typography);
        $this->assertArrayHasKey('font', $theme->body_typography);
        $this->assertArrayHasKey('weight', $theme->body_typography);
        $this->assertArrayHasKey('color', $theme->body_typography);
        $this->assertArrayHasKey('letterSpacing', $theme->body_typography);
        $this->assertArrayHasKey('lineHeight', $theme->body_typography);
    }

    /** @test */
    public function it_validates_components_property_value_types()
    {
        $theme = Theme::factory()->create();

        // Border radius should be a string with max 4 chars
        $this->assertIsString($theme->border_radius);
        $this->assertLessThanOrEqual(4, strlen($theme->border_radius));

        // Shadows should be strings with max 64 chars
        $this->assertIsString($theme->shadow);
        $this->assertLessThanOrEqual(64, strlen($theme->shadow));

        // Padding should be a string with max 32 chars
        $this->assertIsString($theme->padding);
        $this->assertLessThanOrEqual(32, strlen($theme->padding));

        // Spacing should be a string with max 32 chars
        $this->assertIsString($theme->spacing);
        $this->assertLessThanOrEqual(32, strlen($theme->spacing));

        // Margin should be a string with max 32 chars
        $this->assertIsString($theme->margin);
        $this->assertLessThanOrEqual(32, strlen($theme->margin));
    }

    /** @test */
    public function it_properly_belongs_to_organization()
    {
        $organization = Organization::factory()->create();
        $theme = Theme::factory()
            ->forOrganization($organization)
            ->create();

        $this->assertInstanceOf(Organization::class, $theme->organization);
        $this->assertEquals($organization->id, $theme->organization->id);
    }
}
