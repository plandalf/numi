<?php

namespace App\Enums\Theme;

enum FontElement: string
{
    case ROBOTO_MONO = 'Roboto Mono';
    case INTER = 'Inter';
    case ARIAL = 'Arial';
    case HELVETICA = 'Helvetica';
    case VERDANA = 'Verdana';
    case TAHOMA = 'Tahoma';
    case TREBUCHET_MS = 'Trebuchet MS';
    case GEORGIA = 'Georgia';
    case GARAMOND = 'Garamond';
    case TIMES_NEW_ROMAN = 'Times New Roman';
    case PALATINO = 'Palatino';
    case BOOKMAN = 'Bookman';
    case COMIC_SANS_MS = 'Comic Sans MS';
    case IMPACT = 'Impact';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 