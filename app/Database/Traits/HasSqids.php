<?php

namespace App\Database\Traits;

use Illuminate\Support\Str;
use Sqids\Sqids;

trait HasSqids
{
    protected function getSqids(): Sqids
    {
        return new Sqids(
            alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
            minLength: 11,
        );
    }

    /**
     * Get the SQID (encoded identifier) for the current model instance.
     * This returns only the encoded portion (no slug), suitable for headers like JWT kid.
     */
    public function getSqid(): string
    {
        return $this->getSqids()->encode([$this->id, (crc32(static::class) % 256)]);
    }

    /**
     * Decode an SQID back to the integer id for the current model class.
     * Verifies the embedded class checksum to avoid cross-model collisions.
     */
    public static function decodeSqid(string $hashid): ?int
    {
        $sqids = new Sqids(
            alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
            minLength: 11,
        );
        $ids = $sqids->decode($hashid);
        if (empty($ids) || count($ids) < 2) {
            return null;
        }
        $expected = (crc32(static::class) % 256);
        return ($ids[1] === $expected) ? (int) $ids[0] : null;
    }

    public function getRouteKey()
    {
        $name = $this->name;

        return implode('-', array_filter([
            $name ? Str::slug($name) : null,
            $this->getSqid(),
        ]));
    }

    public function resolveRouteBinding($value, $field = null)
    {
        $hashid = Str::contains($value, '-')
            ? substr($value, strrpos($value, '-') + 1)
            : $value;
        $ids = $this->getSqids()->decode($hashid);

        if (empty($ids)) {
            return null;
        }

        return static::find($ids[0]);
    }
}
