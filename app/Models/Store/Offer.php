<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Database\Traits\HasSqids;
use App\Database\Traits\UuidRouteKey;
use App\Models\Media;
use App\Models\Theme;
use App\Models\HostedPage;
use App\Observers\OfferObserver;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Organization;
use Illuminate\Support\Str;
use Illuminate\Support\Uri;

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
 * @property string|null $checkout_success_url
 * @property string|null $checkout_cancel_url
 * @property string $public_url
 * @property Organization $organization
 */
#[ObservedBy(OfferObserver::class)]
class Offer extends Model
{
    /** @use HasFactory<\Database\Factories\OfferFactory> */
    use HasFactory,
        SoftDeletes,
        HasSqids;

    protected $table = 'store_offers';

    protected $fillable = [
        'organization_id',
        'theme_id',
        'name',
        'description',
        'product_image_id',
        'hosted_page_id',
        'status',
        'view',
        'properties',
        'uuid',
        'checkout_success_url',
        'checkout_cancel_url',
        'is_hosted',
    ];

    protected $casts = [
        'status' => 'string',
        'view' => 'json',
        'properties' => 'array',
        'is_hosted' => 'boolean',
    ];

    protected $with = ['productImage'];

    const STATUS_DRAFT = 'draft';

    const STATUS_PUBLISHED = 'published';

    const STATUS_ARCHIVED = 'archived';

    public static function boot()
    {
        parent::boot();

        static::creating(function ($offer) {
            $offer->uuid ??= Str::uuid()->toString();
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function productImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'product_image_id');
    }

    public function offerItems(): HasMany
    {
        return $this->hasMany(OfferItem::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function screenshot(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'screenshot_id');
    }

    public function hostedPage(): BelongsTo
    {
        return $this->belongsTo(HostedPage::class, 'hosted_page_id');
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

    public function getPublicUrlAttribute(): string
    {
        $organization = $this->organization;
        $subdomain = $organization->getSubdomainHost();

        if ($subdomain) {
            $uri = Uri::route('offers.show', ['offer' => $this])
                ->withHost($subdomain);

            return $uri->__toString();
        }

        return route('offers.show', $this);
    }
}
