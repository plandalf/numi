<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
    ];

    protected $casts = [
        'archived_at' => 'datetime',
    ];

    public function prices(): HasMany
    {
        return $this->hasMany(Price::class);
    }
}
