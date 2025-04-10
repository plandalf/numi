<?php

namespace App\Enums\Theme\Color;

enum ColorComponentType: string
{
    case PRIMARY_COLOR = 'primary_color';
    case SECONDARY_COLOR = 'secondary_color';
    case CANVAS = 'canvas';
    case PRIMARY_SURFACE = 'primary_surface';
    case SECONDARY_SURFACE = 'secondary_surface';
    case PRIMARY_BORDER = 'primary_border';
    case SECONDARY_BORDER = 'secondary_border';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 