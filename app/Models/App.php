<?php

namespace App\Models;

use App\Database\Model;
use App\Models\Automation\Trigger;
use Carbon\Carbon;
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
 *
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class App extends Model
{
    use HasFactory;

    protected $table = 'automation_apps';

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

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }
}
