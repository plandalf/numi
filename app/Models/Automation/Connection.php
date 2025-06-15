<?php

namespace App\Models\Automation;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Crypt;
use App\Models\Organization;
use App\Models\User;

class Connection extends Model
{
    use HasFactory;

    protected $fillable = [
        'app_id',
        'organization_id',
        'user_id',
        'name',
        'description',
        'is_active',
        'last_tested_at',
        'last_test_result',
        'auth_data',
        'auth_expires_at',
        'config',
        'usage_count',
        'last_used_at',
        'error_count',
        'last_error_at',
        'last_error_message',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_tested_at' => 'datetime',
        'last_test_result' => 'json',
        'auth_expires_at' => 'datetime',
        'config' => 'json',
        'last_used_at' => 'datetime',
        'last_error_at' => 'datetime',
    ];

    protected $hidden = [
        'auth_data', // Never expose raw auth data
    ];

    /**
     * Get the app this connection belongs to
     */
    public function app(): BelongsTo
    {
        return $this->belongsTo(App::class);
    }

    /**
     * Get the organization this connection belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the user who created this connection
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Encrypt/decrypt auth data
     */
    protected function authData(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Crypt::decryptString($value) : null,
            set: fn ($value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    /**
     * Scope to get only active connections
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get connections for a specific organization
     */
    public function scopeForOrganization($query, int $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Check if connection is expired (for OAuth tokens)
     */
    public function isExpired(): bool
    {
        return $this->auth_expires_at && $this->auth_expires_at->isPast();
    }

    /**
     * Check if connection needs refresh (expires within 1 hour)
     */
    public function needsRefresh(): bool
    {
        return $this->auth_expires_at && 
               $this->auth_expires_at->subHour()->isPast();
    }

    /**
     * Mark connection as used
     */
    public function markAsUsed(): void
    {
        $this->increment('usage_count');
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Record an error for this connection
     */
    public function recordError(string $message): void
    {
        $this->increment('error_count');
        $this->update([
            'last_error_at' => now(),
            'last_error_message' => $message,
        ]);
    }

    /**
     * Test the connection
     */
    public function test(): array
    {
        // This would be implemented based on the app's test endpoint
        // For now, return a basic structure
        $result = [
            'success' => true,
            'message' => 'Connection test not implemented for this app',
            'tested_at' => now()->toISOString(),
        ];

        $this->update([
            'last_tested_at' => now(),
            'last_test_result' => $result,
        ]);

        return $result;
    }

    /**
     * Get decrypted auth data as array
     */
    public function getAuthData(): ?array
    {
        $data = $this->authData;
        return $data ? json_decode($data, true) : null;
    }

    /**
     * Set auth data from array
     */
    public function setAuthData(array $data): void
    {
        $this->auth_data = json_encode($data);
    }
}
