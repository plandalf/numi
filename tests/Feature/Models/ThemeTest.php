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
            'light_text_color' => '#FFFFFF',
            'dark_text_color' => '#000000',
            'main_font' => 'Arial',
            'mono_font' => 'Courier New',
            'border_radius' => '4px',
            'shadow_sm' => '0 1px 2px rgba(0,0,0,0.1)',
            'h1_typography' => ['16px', 'Arial', '700'],
            'h2_typography' => ['14px', 'Arial', '600'],
            'body_typography' => ['14px', 'Arial', '400'],
        ]);

        $theme->save();

        $this->assertEquals('#FF0000', $theme->primary_color);
        $this->assertEquals('#00FF00', $theme->secondary_color);
        $this->assertEquals('#FFFFFF', $theme->light_text_color);
        $this->assertEquals('#000000', $theme->dark_text_color);
        $this->assertEquals('Arial', $theme->main_font);
        $this->assertEquals('Courier New', $theme->mono_font);
        $this->assertEquals('4px', $theme->border_radius);
        $this->assertEquals('0 1px 2px rgba(0,0,0,0.1)', $theme->shadow_sm);
        $this->assertEquals(['16px', 'Arial', '700'], $theme->h1_typography);
        $this->assertEquals(['14px', 'Arial', '600'], $theme->h2_typography);
        $this->assertEquals(['14px', 'Arial', '400'], $theme->body_typography);
    }

    /** @test */
    public function it_validates_color_property_values_types()
    {
        $theme = Theme::factory()->create();

        // Colors should be 6 characters (hex without alpha)
        $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $theme->primary_color);
        $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $theme->secondary_color);
        $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $theme->light_text_color);
        $this->assertMatchesRegularExpression('/^#[0-9A-Fa-f]{6}$/', $theme->dark_text_color);
    }

    /** @test */
    public function it_validates_typography_property_value_types()
    {
        $theme = Theme::factory()->create();

        // Fonts should be strings
        $this->assertIsString($theme->main_font);
        $this->assertIsString($theme->mono_font);

        // Typography arrays should have 3 elements
        $this->assertIsArray($theme->h1_typography);
        $this->assertCount(3, $theme->h1_typography);
        $this->assertIsString($theme->h1_typography[0]); // size
        $this->assertIsString($theme->h1_typography[1]); // font
        $this->assertIsString($theme->h1_typography[2]); // weight

        $this->assertIsArray($theme->body_typography);
        $this->assertCount(3, $theme->body_typography);
        $this->assertIsString($theme->body_typography[0]); // size
        $this->assertIsString($theme->body_typography[1]); // font
        $this->assertIsString($theme->body_typography[2]); // weight
    }

    /** @test */
    public function it_validates_components_property_value_types()
    {
        $theme = Theme::factory()->create();

        // Border radius should be a string with max 4 chars
        $this->assertIsString($theme->border_radius);
        $this->assertLessThanOrEqual(4, strlen($theme->border_radius));

        // Shadows should be strings with max 64 chars
        $this->assertIsString($theme->shadow_sm);
        $this->assertLessThanOrEqual(64, strlen($theme->shadow_sm));

        $this->assertIsString($theme->shadow_md);
        $this->assertLessThanOrEqual(64, strlen($theme->shadow_md));

        $this->assertIsString($theme->shadow_lg);
        $this->assertLessThanOrEqual(64, strlen($theme->shadow_lg));

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
