<?php

namespace App\Enums\Theme\Color;

enum ColorText: string
{
    case DARK_TEXT = 'dark_text';
    case LIGHT_TEXT = 'light_text';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 