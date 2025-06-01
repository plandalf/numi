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

    public static function themeDefaults(): array
    {
        return [
            'primary_color' => '#18181B',
            'primary_contrast_color' => '#FFFFFF',
            'secondary_color' => '#8b8b8d',
            'secondary_contrast_color' => '#FFFFFF',
            'canvas_color' => '#FFFFFF',
            'primary_surface_color' => '#FFFFFF',
            'secondary_surface_color' => '#FAFAFA',
            'primary_border_color' => '#dadada',
            'secondary_border_color' => '#33a5ea',
            'warning_color' => '#fab900',
            'success_color' => '#169966',
            'highlight_color' => '#36a6f4',
            'main_font' => null,
            'mono_font' => null,
            'h1_typography' => [
                'color' => '#18181B',
                'font' => 'Inter',
                'size' => '32px',
                'weight' => '700',
                'lineHeight' => '1.8rem',
                'letterSpacing' => '0px',
            ],
            'h2_typography' => [
                'color' => '#18181B',
                'font' => 'Inter',
                'size' => '24px',
                'weight' => '700',
                'lineHeight' => '1.2rem',
                'letterSpacing' => '0px',
            ],
            'h3_typography' => [
                'color' => '#18181B',
                'font' => 'Inter',
                'size' => '20px',
                'weight' => '700',
                'lineHeight' => '1.2rem',
                'letterSpacing' => '0px',
            ],
            'h4_typography' => [
                'color' => '#18181B',
                'font' => 'Inter',
                'size' => '16px',
                'weight' => '600',
                'lineHeight' => '1.2rem',
                'letterSpacing' => '0px',
            ],
            'h5_typography' => [
                'color' => '#18181B',
                'font' => 'Inter',
                'size' => '14px',
                'weight' => '600',
                'lineHeight' => '1.2rem',
                'letterSpacing' => '0px',
            ],
            'label_typography' => [
                'color' => '#18181B',
                'font' => 'Inter',
                'size' => '14px',
                'weight' => '500',
                'lineHeight' => '1.2rem',
                'letterSpacing' => '0px',
            ],
            'body_typography' => [
                'color' => '#18181B',
                'font' => 'Inter',
                'size' => '14px',
                'weight' => '400',
                'lineHeight' => '1.2rem',
                'letterSpacing' => '0px',
            ],
            'border_radius' => '8px',
            'shadow' => '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
            'padding' => '0.5rem',
            'spacing' => '0.5rem',
            'margin' => '0',
        ];
    }

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
