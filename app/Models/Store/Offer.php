<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Database\Traits\UuidRouteKey;
use App\Models\Media;
use App\Models\Theme;
use App\Observers\OfferObserver;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Catalog\Price;

/**
 * @property int $organization_id
 * @property int|null $theme_id
 * @property string|null $name
 * @property string|null $description
 * @property int $product_image_id
 * @property array $view
 * @property array|null $properties
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Carbon|null $deleted_at
 * @property string $uuid
 */
#[ObservedBy(OfferObserver::class)]
class Offer extends Model
{
    /** @use HasFactory<\Database\Factories\OfferFactory> */
    use HasFactory,
        SoftDeletes,
        UuidRouteKey;

    protected $table = 'store_offers';

    protected $fillable = [
        'organization_id',
        'theme_id',
        'name',
        'description',
        'product_image_id',
        'status',
        'view',
        'properties',
        'uuid',
    ];

    protected $casts = [
        'status' => 'string',
        'view' => 'json',
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

    public function offerItems(): HasMany
    {
        return $this->hasMany(OfferItem::class);
    }

    /**
     * Get the offer prices for the offer.
     */
    public function offerPrices(): HasMany
    {
        return $this->hasMany(OfferPrice::class);
    }


    public function offerProducts(): HasMany
    {
        return $this->hasMany(OfferProduct::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function screenshot(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'screenshot_id');
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

    /**
     * Get all products with their associated prices for this offer.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough
     */
    public function productsWithPrices()
    {
        return $this->offerProducts()->with(['product', 'offerPrices.price']);
    }
}
