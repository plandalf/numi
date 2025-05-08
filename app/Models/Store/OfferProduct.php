<?php

namespace App\Models\Store;

use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;


/**
 * @property Offer $offer
 * @property Product $product
 * @property Collection<OfferPrice> $offerPrices
 * @property Collection<Price> $prices
 * @property string $type
 * @property int $offer_id
 * @property int $product_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Carbon $deleted_at
 */
class OfferProduct extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'store_offer_products';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'offer_id',
        'product_id',
        'type',
        'deleted_at',
    ];

    /**
     * Get the offer that this product belongs to.
     */
    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    /**
     * Get the product associated with this offer product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function offerPrices(): HasMany
    {
        return $this->hasMany(OfferPrice::class);
    }

    /**
     * Get the prices associated with the offer through offer_prices.
     */
    public function prices()
    {
        return $this->belongsToMany(Price::class, 'store_offer_prices', 'offer_product_id', 'price_id')
            ->withTimestamps()
            ->wherePivotNull('deleted_at');
    }

}
