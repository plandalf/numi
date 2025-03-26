<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OfferVariant extends Model
{
    use SoftDeletes;

    protected $table = 'store_offer_variants';

    protected $fillable = [
        'offer_id',
        'name',
        'description',
        'type',
        'pricing_model',
        'amount',
        'currency',
        'properties',
    ];

    protected $casts = [
        'properties' => 'array',
        'amount' => 'integer',
    ];

    const TYPE_ONE_TIME = 'one_time';
    const TYPE_SUBSCRIPTION = 'subscription';

    const PRICING_MODEL_STANDARD = 'standard';
    const PRICING_MODEL_GRADUATED = 'graduated';
    const PRICING_MODEL_VOLUME = 'volume';
    const PRICING_MODEL_PACKAGE = 'package';

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function isOneTime(): bool
    {
        return $this->type === self::TYPE_ONE_TIME;
    }

    public function isSubscription(): bool
    {
        return $this->type === self::TYPE_SUBSCRIPTION;
    }

    public function getAmountFormatted(): string
    {
        return number_format($this->amount / 100, 2);
    }
}
