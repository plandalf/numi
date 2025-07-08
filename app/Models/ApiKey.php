<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'key',
        'prefix',
        'key_preview',
        'is_active',
        'organization_id',
        'created_by',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = [
        'key', // Hide the actual key from JSON responses
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Generate a key preview for display purposes
     */
    public static function generateKeyPreview(string $key): string
    {
        // Find the underscore to separate prefix from key part
        $underscorePos = strpos($key, '_');
        
        if ($underscorePos === false) {
            // Fallback if no underscore found
            return substr($key, 0, 8) . str_repeat('*', strlen($key) - 8);
        }
        
        $prefix = substr($key, 0, $underscorePos + 1); // Include the underscore
        $keyPart = substr($key, $underscorePos + 1);
        
        // Show first 8 characters of the key part, mask the rest
        $visibleKeyChars = 8;
        $maskedKeyChars = strlen($keyPart) - $visibleKeyChars;
        
        return $prefix . substr($keyPart, 0, $visibleKeyChars) . str_repeat('*', $maskedKeyChars);
    }

    /**
     * Mark API key as used
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Check if the API key matches the given key
     */
    public function matches(string $key): bool
    {
        return hash_equals($this->key, $key);
    }

    /**
     * Scope for active keys
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for organization keys
     */
    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }
}
