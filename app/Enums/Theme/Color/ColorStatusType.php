<?php

namespace App\Enums\Theme\Color;

enum ColorStatusType: string
{
    case DANGER = 'danger';
    case INFO = 'info';
    case WARNING = 'warning';
    case SUCCESS = 'success';
    case HIGHLIGHT = 'highlight';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
} 