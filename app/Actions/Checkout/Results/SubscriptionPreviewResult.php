<?php

declare(strict_types=1);

namespace App\Actions\Checkout\Results;

final class SubscriptionPreviewResult implements \JsonSerializable
{
    public function __construct(
        public bool $enabled,
        public ?string $reason = null,
        public ?array $effective = null,
        public ?array $current = null,
        public ?array $proposed = null,
        public ?array $delta = null,
        public ?array $invoicePreview = null,
        public ?array $actions = null,
        public ?string $note = null,
    ) {}

    public static function disabled(string $reason): self
    {
        return new self(false, $reason);
    }

    public static function enabled(array $payload): self
    {
        return new self(
            true,
            null,
            $payload['effective'] ?? null,
            $payload['current'] ?? null,
            $payload['proposed'] ?? null,
            $payload['delta'] ?? null,
            $payload['invoice_preview'] ?? null,
            $payload['actions'] ?? null,
            $payload['note'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'enabled' => $this->enabled,
            'reason' => $this->reason,
            'effective' => $this->effective,
            'current' => $this->current,
            'proposed' => $this->proposed,
            'delta' => $this->delta,
            'invoice_preview' => $this->invoicePreview,
            'actions' => $this->actions,
            'note' => $this->note,
        ], static fn ($v) => ! is_null($v));
    }

    public function jsonSerialize(): mixed
    {
        return $this->toArray();
    }
}
