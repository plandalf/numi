<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Models\Catalog\Price;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Slot extends Model
{
    protected $table = 'store_offer_slots';

    protected $fillable = [
        'offer_id',
        'organization_id',
        'key',
        'name',
        'default_price_id',
        'is_required',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the offer that owns the slot.
     */
    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class, 'offer_id');
    }

    /**
     * Get the default price associated with the slot.
     */
    public function defaultPrice(): BelongsTo
    {
        return $this->belongsTo(Price::class, 'default_price_id');
    }
}
