<?php

namespace App\Enums\Theme\Typography;

enum TypographyPropertyType: string
{
    case MAIN_FONT = 'main_font';
    case MONO_FONT = 'mono_font';
    case H1 = 'h1';
    case H2 = 'h2';
    case H3 = 'h3';
    case H4 = 'h4';
    case H5 = 'h5';
    case H6 = 'h6';
    case LABEL = 'label';
    case BODY = 'body';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 