<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Models\Catalog\Price;
use App\Enums\Store\OfferItemType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class OfferItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'store_offer_items';

    protected $fillable = [
        'offer_id',
        'key',
        'name',
        'default_price_id',
        'is_required',
        'is_highlighted',
        // 'is_tax_inclusive',
        // 'tax_rate',
        'sort_order',
        'type',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_highlighted' => 'boolean',
        // 'is_tax_inclusive' => 'boolean',
        // 'tax_rate' => 'float',
        'sort_order' => 'integer',
        'type' => OfferItemType::class,
    ];

    /**
     * Get the offer that owns the offer item.
     */
    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class, 'offer_id');
    }

    /**
     * Get the default price associated with the offer item.
     */
    public function defaultPrice(): BelongsTo
    {
        return $this->belongsTo(Price::class, 'default_price_id');
    }

    public function offerPrices(): HasMany
    {
        return $this->hasMany(OfferPrice::class, 'offer_item_id');
    }

    public function prices(): HasManyThrough
    {
        return $this->hasManyThrough(Price::class, OfferPrice::class, 'offer_item_id', 'id', 'id', 'price_id');
    }
}
