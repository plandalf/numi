<?php

namespace App\Enums\Theme;

enum ElementType: string
{
    case OBJECT = 'object';
    case COLOR = 'color';
    case SIZE = 'size';
    case FONT = 'font';
    case WEIGHT = 'weight';
    case SHADOW = 'shadow';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 