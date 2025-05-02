<?php

namespace App\Models\Catalog;

use App\Enums\ChargeType;
use App\Models\Integration;
use App\Modules\Billing\Charges\GraduatedCharge;
use App\Modules\Billing\Charges\OneTimeCharge;
use App\Modules\Billing\Charges\PackageCharge;
use App\Modules\Billing\Charges\VolumeCharge;
use App\Modules\Billing\CurrencyCast;
use App\Modules\Billing\MoneyCast;
use App\Modules\Integrations\AbstractIntegration;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Money\Currency;
use Money\Money;
use Parental\HasChildren;

/**
 * App\Models\Catalog\Price
 *
 * @property int $id
 * @property int $product_id
 * @property int $organization_id
 * @property int|null $parent_list_price_id If scope=custom, points to list price base
 * @property string $scope list or custom
 * @property ChargeType $type one_time|graduated|standard|volume|package
 * @property Money $amount Base price/amount in cents
 * @property Currency $currency 3-letter ISO currency code
 * @property array|null $properties
 * @property string|null $name Optional name for the price
 * @property string|null $lookup_key Optional unique lookup key
 * @property string|null $renew_interval Recurring interval (e.g., day, week, month, year)
 * @property string|null $billing_anchor Billing anchor (e.g., start_of_month)
 * @property int|null $recurring_interval_count Number of intervals between renewals
 * @property int|null $cancel_after_cycles Number of cycles before cancellation
 * @property string|null $gateway_provider Payment gateway provider (e.g., stripe)
 * @property string|null $gateway_price_id ID of the price on the payment gateway
 * @property bool $is_active Whether the price is currently active
 * @property Carbon|null $archived_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Product $product
 * @property-read Price|null $parentListPrice
 */
class Price extends Model
{
    use HasChildren;
    use HasFactory, SoftDeletes;

    protected $table = 'catalog_prices';

    const MAX_QUANTITY = 1_000_000_000_000; // 1 trillion

    protected $fillable = [
        'product_id',
        'organization_id',
        'parent_list_price_id',

        'scope', // list or custom
        'type',  // one_time|graduated|standard|volume|package

        'amount',
        'currency',
        'properties',

        'name',
        'lookup_key',

        'renew_interval',
        'billing_anchor',
        'recurring_interval_count',
        'cancel_after_cycles',

        // gateway?
        'gateway_provider',
        'gateway_price_id',

        'is_active',
        'archived_at',

        'integration_id',
    ];

    protected $casts = [
        'properties' => 'json',
        'is_active' => 'boolean',
        'archived_at' => 'datetime',
        'type' => ChargeType::class,
        'currency' => CurrencyCast::class,
        'amount' => MoneyCast::class, // Ensure amount is treated as integer (cents)

        'recurring_interval_count' => 'integer',
        'cancel_after_cycles' => 'integer',
    ];

    protected array $childTypes = [
        'graduated' => GraduatedCharge::class,
        'one_time' => OneTimeCharge::class,
        'volume' => VolumeCharge::class,
        'package' => PackageCharge::class,
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function parentListPrice(): BelongsTo
    {
        return $this->belongsTo(Price::class, 'parent_list_price_id');
    }

    // Scope to get only list prices
    public function scopeList($query)
    {
        return $query->where('scope', 'list');
    }

    // Scope to get only custom prices
    public function scopeCustom($query)
    {
        return $query->where('scope', 'custom');
    }

    // Scope to get only active prices
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * The offer variants that belong to the Price.
     */
    public function offerVariants(): BelongsToMany
    {
        return $this->belongsToMany(OfferVariant::class, 'offer_variant_price');
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function integrationClient(): ?AbstractIntegration
    {
        if (! $this->integration) {
            return null;
        }

        return get_integration_client_class($this->integration);
    }
}
