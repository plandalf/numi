<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Models\Organization;
use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $organization_id
 * @property array|null $color
 * @property array|null $typography
 * @property array|null $components
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class Theme extends Model
{
    /** @use HasFactory<\Database\Factories\Store\ThemeFactory> */
    use HasFactory,
        SoftDeletes;

    protected $table = 'store_themes';

    protected $fillable = [
        'organization_id',
        'name',
        'color',
        'typography',
        'components',
    ];

    protected $casts = [
        'name' => 'string',
        'color' => 'array',
        'typography' => 'array',
        'components' => 'array',
    ];

    /**
     * Boot the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function (Theme $theme) {
            // Set default theme properties if not provided
            if (empty($theme->color) && empty($theme->typography) && empty($theme->components)) {
                $theme->setThemeProperties(ThemeProperties::fromArray([]));
            }
        });
    }

    /**
     * Get the theme properties as a ThemeProperties instance.
     *
     * @return ThemeProperties
     */
    public function getThemeProperties(): ThemeProperties
    {
        return ThemeProperties::fromArray([
            'color' => $this->color ?? [],
            'typography' => $this->typography ?? [],
            'components' => $this->components ?? [],
        ]);
    }

    /**
     * Set the theme properties from a ThemeProperties instance.
     *
     * @param ThemeProperties $properties
     * @return void
     */
    public function setThemeProperties(ThemeProperties $properties): void
    {
        $array = $properties->toArray();
        $this->color = $array['color'] ?? null;
        $this->typography = $array['typography'] ?? null;
        $this->components = $array['components'] ?? null;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function offer(): HasOne
    {
        return $this->hasOne(Offer::class);
    }
}
