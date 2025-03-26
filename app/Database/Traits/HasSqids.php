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

    public function getRouteKey()
    {
        $name = $this->name;

        return implode('-', array_filter([
            $name ? Str::slug($name) : null,
            $this->getSqids()->encode([$this->id, (crc32(static::class) % 256)])
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
