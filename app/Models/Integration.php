<?php

namespace App\Models;

use App\Enums\IntegrationType;
use App\Modules\Integrations\AbstractIntegration;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $lookup_key
 * @property string $type
 * @property string $organization_id
 * @property string $name
 * @property string $secret
 * @property array $config
 * @property string $current_state
 */
class Integration extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'lookup_key',
        'type',
        'organization_id',
        'name',
        'secret',
        'config',
        'current_state',
        'environment',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'config' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'type' => IntegrationType::class,
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'current_state' => 'created',
    ];

    /**
     * Get the organization that owns the integration.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function integrationClient(): AbstractIntegration
    {
        return get_integration_client_class($this);
    }
}
