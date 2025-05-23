<?php

namespace App\Models\Catalog;

use App\Enums\IntegrationType;
use App\Enums\ProductStatus;
use App\Models\Integration;
use App\Modules\Integrations\AbstractIntegration;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $lookup_key
 * @property string $gateway_product_id
 * @property string $name
 * @property string $description
 * @property ProductStatus $status
 */
class Product extends Model
{
    use HasFactory, SoftDeletes;

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
    ];

    protected $casts = [
        'archived_at' => 'datetime',
        'gateway_provider' => IntegrationType::class,
        'status' => ProductStatus::class,
    ];

    public function prices(): HasMany
    {
        return $this->hasMany(Price::class);
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
