<?php

namespace App\Services;

use App\Models\Theme;
use App\Models\Store\Offer;

class FontExtractionService
{
    /**
     * Extract unique fonts from a theme.
     */
    public function extractFontsFromTheme(?Theme $theme): array
    {
        if (!$theme) {
            return [];
        }

        $fonts = collect();

        // Add main and mono fonts if they exist
        if ($theme->main_font) {
            $fonts->push($theme->main_font);
        }
        if ($theme->mono_font) {
            $fonts->push($theme->mono_font);
        }

        // Typography fields that contain font information
        $typographyFields = [
            'h1_typography',
            'h2_typography',
            'h3_typography',
            'h4_typography',
            'h5_typography',
            'label_typography',
            'body_typography'
        ];

        // Process each typography field
        foreach ($typographyFields as $field) {
            $typography = $theme->{$field};
            if (is_array($typography) && isset($typography['font'])) {
                $font = $typography['font'];
                if ($font && is_string($font)) {
                    $fonts->push($font);
                }
            }
        }

        return $fonts->unique()->sort()->values()->all();
    }

    /**
     * Extract unique fonts from an offer's view.
     */
    public function extractFontsFromView(array $view): array
    {
        $fonts = collect();

        if (!isset($view['pages']) || !is_array($view['pages'])) {
            return [];
        }

        // Process each page
        foreach ($view['pages'] as $page) {
            if (!isset($page['view']) || !is_array($page['view'])) {
                continue;
            }

            // Process each section in the page
            foreach ($page['view'] as $section) {
                if (!is_array($section)) {
                    continue;
                }

                // Check section style
                $sectionFonts = $this->getFontsFromStyle($section['style'] ?? []);
                $fonts = $fonts->merge($sectionFonts);

                // Check each block's style
                if (isset($section['blocks']) && is_array($section['blocks'])) {
                    foreach ($section['blocks'] as $block) {
                        if (is_array($block) && isset($block['style'])) {
                            $blockFonts = $this->getFontsFromStyle($block['style']);
                            $fonts = $fonts->merge($blockFonts);
                        }
                    }
                }
            }
        }

        return $fonts->unique()->sort()->values()->all();
    }

    /**
     * Extract fonts from a style object.
     */
    private function getFontsFromStyle(array $style): array
    {
        $fonts = [];

        foreach ($style as $key => $value) {
            if (str_ends_with($key, 'Font') && is_string($value)) {
                $fonts[] = $value;
            }
            
            // Also check nested objects that might contain font information
            if (is_array($value) && isset($value['font']) && is_string($value['font'])) {
                $fonts[] = $value['font'];
            }
        }

        return $fonts;
    }

    /**
     * Get all fonts for an offer (theme + view fonts).
     */
    public function extractAllFontsForOffer(Offer $offer): array
    {
        $themeFonts = $this->extractFontsFromTheme($offer->theme);
        $viewFonts = $this->extractFontsFromView($offer->view);

        return collect($themeFonts)
            ->merge($viewFonts)
            ->merge(['Inter']) // Always include Inter as default
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    /**
     * Build Google Fonts URL for preloading.
     */
    public function buildGoogleFontsUrl(array $fonts, array $weights = ['400', '500', '600', '700'], string $display = 'swap'): string
    {
        if (empty($fonts)) {
            return '';
        }

        $families = collect($fonts)->map(function ($font) use ($weights) {
            $name = str_replace(' ', '+', $font);
            $weightPart = ':wght@' . implode(';', $weights);
            return "family={$name}{$weightPart}";
        })->join('&');

        return "https://fonts.googleapis.com/css2?{$families}&display={$display}";
    }

    /**
     * Build individual font preload links.
     */
    public function buildFontPreloadLinks(array $fonts, array $weights = ['400', '500', '600', '700']): array
    {
        $links = [];
        
        foreach ($fonts as $font) {
            foreach ($weights as $weight) {
                $fontName = str_replace(' ', '+', $font);
                $url = "https://fonts.googleapis.com/css2?family={$fontName}:wght@{$weight}&display=swap";
                $links[] = [
                    'url' => $url,
                    'font' => $font,
                    'weight' => $weight
                ];
            }
        }

        return $links;
    }
}