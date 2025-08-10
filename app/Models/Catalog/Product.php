<?php

namespace App\Models\Catalog;

use App\Enums\IntegrationType;
use App\Enums\ProductStatus;
use App\Enums\ProductState;
use App\Models\Integration;
use App\Models\Organization;
use App\Modules\Integrations\AbstractIntegration;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property Integration|null $integration
 *
 * @property string $lookup_key
 * @property string $gateway_product_id
 * @property string $name
 * @property string $description
 * @property ProductStatus $status
 * @property int $organization_id
 */
class Product extends \App\Database\Model
{
    use HasFactory,
        SoftDeletes;

    protected $table = 'catalog_products';

    protected $fillable = [
        'organization_id',
        'name',
        'lookup_key',
        'gateway_provider',
        'gateway_product_id',
        'archived_at',
        'integration_id',
        'description',
        'status',
        'image',
        // lifecycle
        'current_state',
        'activated_at',
        'parent_product_id',
    ];

    protected $casts = [
        'archived_at' => 'datetime',
        'gateway_provider' => IntegrationType::class,
        'status' => ProductStatus::class,
        'current_state' => ProductState::class,
        'activated_at' => 'datetime',
    ];

    public function getRouteKeyName()
    {
        return 'lookup_key';
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(Price::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'parent_product_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Product::class, 'parent_product_id');
    }

    // Scopes
    public function scopeActiveAt($query, ?\Carbon\CarbonInterface $at = null)
    {
        $at = $at ?: now();
        return $query
            ->where(function ($q) use ($at) {
                $q->whereNull('activated_at')->orWhere('activated_at', '<=', $at);
            })
            ->whereNull('archived_at');
    }

    public function scopeMarketable($query)
    {
        return $query->whereIn('current_state', [ProductState::active->value, ProductState::testing->value, ProductState::deprecated->value]);
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
