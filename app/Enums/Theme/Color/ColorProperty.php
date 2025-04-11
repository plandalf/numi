<?php

namespace App\Enums\Theme\Color;

enum ColorProperty: string
{
    case COMPONENTS = 'components';
    case TEXT = 'text';
    case STATUS = 'status';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 