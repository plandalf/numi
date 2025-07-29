<?php

namespace App\Models;

use App\Database\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string|null $name
 * @property string|null $description
 * @property string|null $category
 * @property int|null $theme_id
 * @property int|null $organization_id
 * @property array|null $view
 * @property array|null $preview_images
 * @property array|null $hosted_page_style
 * @property array|null $hosted_page_appearance
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class Template extends Model
{
    /** @use HasFactory<\Database\Factories\TemplateFactory> */
    use HasFactory,
        SoftDeletes;

    protected $table = 'templates';

    protected $fillable = [
        'name',
        'description',
        'category',
        'theme_id',
        'organization_id',
        'view',
        'preview_images',
        'hosted_page_style',
        'hosted_page_appearance',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'view' => 'json',
        'preview_images' => 'array',
        'hosted_page_style' => 'array',
        'hosted_page_appearance' => 'array',
    ];

    /**
     * Get the theme associated with the template.
     */
    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    /**
     * Get the organization associated with the template.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope a query to only include global templates (not associated with any organization).
     */
    public function scopeGlobal(Builder $query): Builder
    {
        return $query->whereNull('organization_id');
    }
}
