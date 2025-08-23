<?php

declare(strict_types=1);

namespace App\Modules\Billing\Changes;

use App\Enums\SignalID;

final class ChangePreview implements \JsonSerializable
{
    public function __construct(
        public bool $enabled,
        public SignalID $signal,
        public array $effective,
        public array $totals,
        public array $lines,
        public array $operations,
        public array $commitDescriptor,
        public ?string $reason = null,
        public ?array $actions = null,
    ) {}

    public static function disabled(SignalID $signal, string $reason): self
    {
        return new self(false, $signal, [], [], [], [], [], $reason);
    }

    public function toArray(): array
    {
        return array_filter([
            'enabled' => $this->enabled,
            'signal' => $this->signal->name,
            'effective' => $this->effective,
            'totals' => $this->totals,
            'lines' => $this->lines,
            'operations' => $this->operations,
            'commit_descriptor' => $this->commitDescriptor,
            'reason' => $this->reason,
            'actions' => $this->actions,
        ], static fn ($v) => ! is_null($v));
    }

    public function jsonSerialize(): mixed
    {
        return $this->toArray();
    }
}
