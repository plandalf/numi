<?php

namespace App\Enums;

enum Role: string
{
    case MEMBER = 'member';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
