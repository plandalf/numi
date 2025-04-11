<?php

namespace App\Enums\Theme\Typography;

enum TypographyElement: string
{
    case SIZE = 'size';
    case FONT = 'font';
    case WEIGHT = 'weight';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 