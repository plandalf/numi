<?php

namespace App\Models;

use App\Database\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property string $key
 * @property string $name
 * @property string|null $description
 * @property string|null $icon_url
 * @property string|null $color
 * @property string|null $category
 * @property string $version
 * @property bool $is_active
 * @property bool $is_built_in
 * @property string|null $documentation_url
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class App extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
        'icon_url',
        'color',
        'category',
        'version',
        'is_active',
        'is_built_in',
        'documentation_url',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_built_in' => 'boolean',
    ];

    // Relationships
    public function triggers(): HasMany
    {
        return $this->hasMany(AppTrigger::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(AppAction::class);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }
}
