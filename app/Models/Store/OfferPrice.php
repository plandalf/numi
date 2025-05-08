<?php

declare(strict_types=1);

namespace App\Models\Store;

use App\Database\Model;
use App\Models\Catalog\Price;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $offer_id
 * @property int $price_id
 * @property int $offer_product_id
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class OfferPrice extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'store_offer_prices';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'offer_id',
        'price_id',
        'offer_product_id',
        'deleted_at',
    ];

    /**
     * Get the offer that owns the offer price.
     */
    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class, 'offer_id');
    }

    /**
     * Get the price associated with the offer price.
     */
    public function price(): BelongsTo
    {
        return $this->belongsTo(Price::class, 'price_id');
    }

    /**
     * Get the offer product associated with the offer price.
     */
    public function offerProduct(): BelongsTo
    {
        return $this->belongsTo(OfferProduct::class, 'offer_product_id');
    }
}
