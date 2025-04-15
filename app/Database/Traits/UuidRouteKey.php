<?php

namespace App\Database\Traits;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

trait UuidRouteKey
{
    use HasUuids;

    public function uniqueIds(): array
    {
        return array_merge(parent::uniqueIds(), ['uuid']);
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }
}
