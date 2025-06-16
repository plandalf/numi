<?php

namespace App\Models\Store;

use App\Models\Catalog\Price;
use App\Models\Store\OfferItem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfferPrice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'store_offer_prices';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'offer_item_id',
        'price_id',
        'name',
        'deleted_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [];

    /**
     * Get the offer item that the price belongs to.
     */
    public function offerItem(): BelongsTo
    {
        return $this->belongsTo(OfferItem::class, 'offer_item_id');
    }

    /**
     * Get the price associated with this offer price.
     */
    public function price(): BelongsTo
    {
        return $this->belongsTo(Price::class, 'price_id');
    }
}
