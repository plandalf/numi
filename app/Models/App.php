<?php

namespace App\Models;

use App\Database\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
        'auth_config',
        'actions',
        'triggers',
        'webhook_config',
        'rate_limits',
        'metadata',
        'credentials_schema',
        'documentation_url',
        'developer_name',
        'developer_url',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_built_in' => 'boolean',
        'auth_config' => 'json',
        'actions' => 'json',
        'triggers' => 'json',
        'webhook_config' => 'json',
        'rate_limits' => 'json',
        'metadata' => 'json',
        'credentials_schema' => 'json',
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