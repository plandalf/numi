<?php

namespace App\Models;

use App\Database\Model;
use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int|null $organization_id
 * @property string $name
 * @property string $primary_color
 * @property string $primary_contrast_color
 * 
 * @property string $secondary_color
 * @property string $secondary_contrast_color
 * 
 * @property string $canvas_color
 * @property string $primary_surface_color
 * @property string $secondary_surface_color
 * 
 * @property string $primary_border_color
 * @property string $secondary_border_color
 * 
 * @property string $warning_color
 * @property string $success_color
 * @property string $highlight_color
 * 
 * @property string $main_font
 * @property string $mono_font
 * 
 * @property array $h1_typography
 * @property array $h2_typography
 * @property array $h3_typography
 * @property array $h4_typography
 * @property array $h5_typography
 * 
 * @property array $label_typography
 * @property array $body_typography
 * 
 * @property string $border_radius
 * @property string $shadow
 * 
 * @property string $padding
 * @property string $spacing
 * @property string $margin
 * 
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class Theme extends Model
{
    /** @use HasFactory<\Database\Factories\ThemeFactory> */
    use HasFactory,
        SoftDeletes;

    protected $table = 'themes';

    protected $fillable = [
        'organization_id',
        'name',

        'primary_color',
        'primary_contrast_color',

        'secondary_color',
        'secondary_contrast_color',

        'canvas_color',
        'primary_surface_color',
        'secondary_surface_color',

        'primary_border_color',
        'secondary_border_color',
        
        'warning_color',
        'success_color',
        'highlight_color',

        'main_font',
        'mono_font',

        'h1_typography',
        'h2_typography',
        'h3_typography',
        'h4_typography',
        'h5_typography',

        'label_typography',
        'body_typography',

        'border_radius',
        'shadow',

        'padding',
        'spacing',
        'margin',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'organization_id' => 'integer',
        'h1_typography' => 'json',
        'h2_typography' => 'json',
        'h3_typography' => 'json',
        'h4_typography' => 'json',
        'h5_typography' => 'json',
        'label_typography' => 'json',
        'body_typography' => 'json',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function offer(): HasOne
    {
        return $this->hasOne(Offer::class);
    }

    /**
     * Scope a query to only include global themes.
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('organization_id');
    }
}
