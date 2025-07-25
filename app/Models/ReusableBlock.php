<?php

namespace App\Models;

use App\Database\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReusableBlock extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'reusable_blocks';

    protected $fillable = [
        'organization_id',
        'name',
        'block_type',
        'configuration',
    ];

    protected $casts = [
        'configuration' => 'json',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $query) use ($search) {
            $query->where('name', 'ILIKE', "%{$search}%")
                ->orWhere('block_type', 'ILIKE', "%{$search}%");
        });
    }

    public function getBlockConfiguration(): array
    {
        return array_merge($this->configuration, [
            'type' => $this->block_type,
            'object' => 'block',
        ]);
    }
} 