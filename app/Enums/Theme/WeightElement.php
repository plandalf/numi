<?php

namespace App\Enums\Theme;

enum WeightElement: string
{
    case THIN = '100';
    case EXTRA_LIGHT = '200';
    case LIGHT = '300';
    case REGULAR = '400';
    case MEDIUM = '500';
    case SEMI_BOLD = '600';
    case BOLD = '700';
    case EXTRA_BOLD = '800';
    case BLACK = '900';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
