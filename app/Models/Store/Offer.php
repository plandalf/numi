<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Models\Media;
use App\Models\Theme;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
 */
class Offer extends Model
{
    /** @use HasFactory<\Database\Factories\OfferFactory> */
    use HasFactory,
        SoftDeletes;

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

    public function slots(): HasMany
    {
        return $this->hasMany(Slot::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
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
