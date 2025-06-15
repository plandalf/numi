<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'is_active',
        'is_built_in',
        'auth_config',
        'actions',
        'triggers',
        'webhook_config',
        'rate_limits',
        'metadata',
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
    ];

    /**
     * Get all connections for this app
     */
    public function connections(): HasMany
    {
        return $this->hasMany(Connection::class);
    }

    /**
     * Get active connections for this app
     */
    public function activeConnections(): HasMany
    {
        return $this->connections()->where('is_active', true);
    }

    /**
     * Scope to get only active apps
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get apps by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Check if app requires authentication
     */
    public function requiresAuth(): bool
    {
        return $this->auth_config && 
               isset($this->auth_config['type']) && 
               $this->auth_config['type'] !== 'none';
    }

    /**
     * Get available actions for this app
     */
    public function getAvailableActions(): array
    {
        return $this->actions ?? [];
    }

    /**
     * Get available triggers for this app
     */
    public function getAvailableTriggers(): array
    {
        return $this->triggers ?? [];
    }

    /**
     * Get action by key
     */
    public function getAction(string $key): ?array
    {
        $actions = $this->getAvailableActions();
        return collect($actions)->firstWhere('key', $key);
    }

    /**
     * Get trigger by key
     */
    public function getTrigger(string $key): ?array
    {
        $triggers = $this->getAvailableTriggers();
        return collect($triggers)->firstWhere('key', $key);
    }
}
