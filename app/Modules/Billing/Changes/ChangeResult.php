<?php

declare(strict_types=1);

namespace App\Modules\Billing\Changes;

use App\Enums\SignalID;

final class ChangeResult implements \JsonSerializable
{
    public function __construct(
        public SignalID $signal,
        public string $status,
        public ?array $receipt = null,
        public ?array $provider = null,
    ) {}

    public function toArray(): array
    {
        return array_filter([
            'signal' => $this->signal->name,
            'status' => $this->status,
            'receipt' => $this->receipt,
            'provider' => $this->provider,
        ], static fn ($v) => ! is_null($v));
    }

    public function jsonSerialize(): mixed
    {
        return $this->toArray();
    }
}
