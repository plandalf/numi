<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Models\OfferVariant;
use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Database\Traits\HasSqids;

class Offer extends Model
{
    /** @use HasFactory<\Database\Factories\OfferFactory> */
    use HasFactory;//, HasSqids;

    protected $table = 'store_offers';

    protected $fillable = [
        'name',
        'description',
        'product_image_id',
        'status',
        'default_currency',
        'is_subscription_enabled',
        'is_one_time_enabled',
        'organization_id',
        'view',
        'product_image_id',
        'properties',
        'transaction_webhook_url',

    ];

    protected $casts = [
        'status' => 'string',
        'view' => 'array',
        'properties' => 'array',
    ];

    protected $with = ['productImage'];

    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_ARCHIVED = 'archived';

    public function productImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'product_image_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(OfferVariant::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }
}
