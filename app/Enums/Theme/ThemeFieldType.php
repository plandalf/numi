<?php

namespace App\Enums\Theme;

enum ThemeFieldType: string
{
    case COLOR = 'color';
    case TYPOGRAPHY = 'typography';
    case COMPONENTS = 'components';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 