<?php

namespace Tests\Unit\Services;

use App\Models\Theme;
use App\Models\Store\Offer;
use App\Models\Organization;
use App\Services\FontExtractionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FontExtractionServiceTest extends TestCase
{
    use RefreshDatabase;

    private FontExtractionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new FontExtractionService();
    }

    public function test_extracts_fonts_from_theme(): void
    {
        // Arrange - Use make() instead of create() to avoid factory defaults
        $theme = new Theme([
            'main_font' => 'Roboto',
            'mono_font' => 'Fira Code',
            'h1_typography' => ['font' => 'Poppins'],
            'h2_typography' => ['font' => 'Open Sans'],
            'h3_typography' => ['font' => 'Lato'],
            'h4_typography' => null, // Test null handling
            'h5_typography' => ['font' => 'Montserrat'],
            'label_typography' => ['font' => 'Source Sans Pro'],
            'body_typography' => ['font' => 'Inter'],
        ]);

        // Act
        $fonts = $this->service->extractFontsFromTheme($theme);

        // Assert
        $this->assertContains('Roboto', $fonts);
        $this->assertContains('Fira Code', $fonts);
        $this->assertContains('Poppins', $fonts);
        $this->assertContains('Open Sans', $fonts);
        $this->assertContains('Lato', $fonts);
        $this->assertContains('Montserrat', $fonts);
        $this->assertContains('Source Sans Pro', $fonts);
        $this->assertContains('Inter', $fonts);
        // Should have 8 unique fonts
        $this->assertCount(8, $fonts);
    }

    public function test_extracts_fonts_from_view(): void
    {
        // Arrange
        $view = [
            'pages' => [
                'page1' => [
                    'view' => [
                        'section1' => [
                            'style' => [
                                'titleFont' => 'Montserrat',
                                'bodyFont' => 'Lato'
                            ],
                            'blocks' => [
                                [
                                    'style' => [
                                        'headingFont' => 'Playfair Display'
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        // Act
        $fonts = $this->service->extractFontsFromView($view);

        // Assert
        $this->assertContains('Montserrat', $fonts);
        $this->assertContains('Lato', $fonts);
        $this->assertContains('Playfair Display', $fonts);
        $this->assertCount(3, $fonts);
    }

    public function test_extracts_all_fonts_for_offer(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $theme = Theme::factory()->create([
            'organization_id' => $organization->id,
            'main_font' => 'Roboto',
            'h1_typography' => ['font' => 'Poppins'],
        ]);
        
        $offer = Offer::factory()->create([
            'organization_id' => $organization->id,
            'theme_id' => $theme->id,
            'view' => [
                'pages' => [
                    'page1' => [
                        'view' => [
                            'section1' => [
                                'style' => [
                                    'titleFont' => 'Montserrat'
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]);

        // Act
        $fonts = $this->service->extractAllFontsForOffer($offer);

        // Assert
        $this->assertContains('Inter', $fonts); // Always included
        $this->assertContains('Roboto', $fonts); // From theme
        $this->assertContains('Poppins', $fonts); // From theme
        $this->assertContains('Montserrat', $fonts); // From view
    }

    public function test_builds_google_fonts_url(): void
    {
        // Arrange
        $fonts = ['Roboto', 'Open Sans', 'Poppins'];
        $weights = ['400', '600', '700'];

        // Act
        $url = $this->service->buildGoogleFontsUrl($fonts, $weights, 'swap');

        // Assert
        $this->assertStringContainsString('fonts.googleapis.com/css2', $url);
        $this->assertStringContainsString('family=Roboto:wght@400;600;700', $url);
        $this->assertStringContainsString('family=Open+Sans:wght@400;600;700', $url);
        $this->assertStringContainsString('family=Poppins:wght@400;600;700', $url);
        $this->assertStringContainsString('display=swap', $url);
    }

    public function test_handles_empty_fonts_gracefully(): void
    {
        // Act
        $url = $this->service->buildGoogleFontsUrl([]);

        // Assert
        $this->assertEmpty($url);
    }

    public function test_handles_null_theme_gracefully(): void
    {
        // Act
        $fonts = $this->service->extractFontsFromTheme(null);

        // Assert
        $this->assertEmpty($fonts);
    }
}