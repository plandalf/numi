<?php

declare(strict_types=1);

namespace App\Modules\Billing\Changes;

use App\Enums\SignalID;

final class ChangeIntent
{
    public function __construct(
        public SignalID $signal,
        public ?int $targetLocalPriceId = null,
        public ?int $quantityDelta = null,
        public ?int $creditsDelta = null,
        public ?string $effectiveAt = null
    ) {}
}
