<?php

namespace App\Enums\Theme\Component;

enum ComponentPropertyType: string
{
    case BORDER_RADIUS = 'border_radius';
    case SHADOW_SM = 'shadow_sm';
    case SHADOW_MD = 'shadow_md';
    case SHADOW_LG = 'shadow_lg';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 