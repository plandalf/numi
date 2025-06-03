<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostedPage extends Model
{
    protected $fillable = [
        'organization_id',
        'logo_image_id',
        'background_image_id',
        'style',
    ];

    protected $casts = [
        'style' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function logoImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'logo_image_id');
    }

    public function backgroundImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'background_image_id');
    }

    public function offer(): HasMany
    {
        return $this->hasMany(Store\Offer::class, 'id', 'offer_id');
    }
}
