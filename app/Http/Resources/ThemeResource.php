<?php

namespace App\Http\Resources;

use App\Enums\Theme\FontElement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThemeResource extends JsonResource
{
    public static $wrap = false;

    protected static $defaultValues = [
        'primary_color' => '#000000',
        'primary_contrast_color' => '#000000',

        'secondary_color' => '#000000',
        'secondary_contrast_color' => '#000000',

        'canvas_color' => '#000000',
        'primary_surface_color' => '#000000',
        'secondary_surface_color' => '#000000',

        'primary_border_color' => '#000000',
        'secondary_border_color' => '#000000',

        'warning_color' => '#000000',
        'success_color' => '#000000',
        'highlight_color' => '#000000',

        'main_font' => FontElement::INTER->value,
        'mono_font' => FontElement::INTER->value,

        'h1_typography' => [
            'size' => '32px',
            'font' => FontElement::INTER->value,
            'weight' => '600',
            'lineHeight' => '1.1',
            'letterSpacing' => '0px',
            'color' => '#000000'
        ],
        'h2_typography' => [
            'size' => '24px',
            'font' => FontElement::INTER->value,
            'weight' => '600',
            'lineHeight' => '1.1',
            'letterSpacing' => '0px',
            'color' => '#000000'
        ],
        'h3_typography' => [
            'size' => '19px',
            'font' => FontElement::INTER->value,
            'weight' => '600',
            'lineHeight' => '1.2',
            'letterSpacing' => '0px',
            'color' => '#000000'
        ],
        'h4_typography' => [
            'size' => '16px',
            'font' => FontElement::INTER->value,
            'weight' => '600',
            'lineHeight' => '1.1',
            'letterSpacing' => '0px',
            'color' => '#000000'
        ],
        'h5_typography' => [
            'size' => '13px',
            'font' => FontElement::INTER->value,
            'weight' => '600',
            'lineHeight' => '1.1',
            'letterSpacing' => '0px',
            'color' => '#000000'
        ],

        'label_typography' => [
            'size' => '16px',
            'font' => FontElement::INTER->value,
            'weight' => '500',
            'lineHeight' => '1.1',
            'letterSpacing' => '0px',
            'color' => '#000000'
        ],

        'body_typography' => [
            'size' => '16px',
            'font' => FontElement::INTER->value,
            'weight' => '400',
            'lineHeight' => '1.1',
            'letterSpacing' => '0px',
            'color' => '#000000'
        ],

        'border_radius' => '12px',
        'shadow' => '0 0px 0px 0 rgba(0, 0, 0, 0.05)',

        'padding' => '5px 10px 5px 10px',
        'margin' => '5px 10px 5px 10px',
        'spacing' => '5px',
    ];

    public static function getDefaultValues(string $key)
    {
        if(!isset(self::$defaultValues[$key])) {
            return null;
        }

        return self::$defaultValues[$key];
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,

            'primary_color' => $this->primary_color ?? self::getDefaultValues('primary_color'),
            'primary_contrast_color' => $this->primary_contrast_color ?? self::getDefaultValues('primary_contrast_color'),

            'secondary_color' => $this->secondary_color ?? self::getDefaultValues('secondary_color'),
            'secondary_contrast_color' => $this->secondary_contrast_color ?? self::getDefaultValues('secondary_contrast_color'),

            'canvas_color' => $this->canvas_color ?? self::getDefaultValues('canvas_color'),
            'primary_surface_color' => $this->primary_surface_color ?? self::getDefaultValues('primary_surface_color'),
            'secondary_surface_color' => $this->secondary_surface_color ?? self::getDefaultValues('secondary_surface_color'),

            'primary_border_color' => $this->primary_border_color ?? self::getDefaultValues('primary_border_color'),
            'secondary_border_color' => $this->secondary_border_color ?? self::getDefaultValues('secondary_border_color'),

            'warning_color' => $this->warning_color ?? self::getDefaultValues('warning_color'),
            'success_color' => $this->success_color ?? self::getDefaultValues('success_color'),
            'highlight_color' => $this->highlight_color ?? self::getDefaultValues('highlight_color'),

            'main_font' => $this->main_font ?? self::getDefaultValues('main_font'),
            'mono_font' => $this->mono_font ?? self::getDefaultValues('mono_font'),

            'h1_typography' => $this->h1_typography ?? self::getDefaultValues('h1_typography'),
            'h2_typography' => $this->h2_typography ?? self::getDefaultValues('h2_typography'),
            'h3_typography' => $this->h3_typography ?? self::getDefaultValues('h3_typography'),
            'h4_typography' => $this->h4_typography ?? self::getDefaultValues('h4_typography'),
            'h5_typography' => $this->h5_typography ?? self::getDefaultValues('h5_typography'),

            'label_typography' => $this->label_typography ?? self::getDefaultValues('label_typography'),
            'body_typography' => $this->body_typography ?? self::getDefaultValues('body_typography'),

            'border_radius' => $this->border_radius ?? self::getDefaultValues('border_radius'),
            'shadow' => $this->shadow ?? self::getDefaultValues('shadow'),

            'padding' => $this->padding ?? self::getDefaultValues('padding'),
            'spacing' => $this->spacing ?? self::getDefaultValues('spacing'),
            'margin' => $this->margin ?? self::getDefaultValues('margin'),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
