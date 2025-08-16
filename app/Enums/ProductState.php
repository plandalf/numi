<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Represents the lifecycle state of a catalog product.
 */
enum ProductState: string
{
    case draft = 'draft';
    case testing = 'testing';
    case active = 'active';
    case deprecated = 'deprecated';
    case retired = 'retired';

    public function isMarketable(): bool
    {
        return in_array($this, [self::active, self::testing, self::deprecated], true);
    }
}


