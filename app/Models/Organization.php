<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Organization extends Model
{
    /** @use HasFactory<\Database\Factories\OrganizationFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'ulid',
        'default_currency',
    ];

    protected $appends = [
        'invite_link',
    ];

    protected $attributes = [
        'default_currency' => 'USD',
    ];

    public const AVAILABLE_CURRENCIES = [
        'USD' => 'US Dollar',
        'EUR' => 'Euro',
        'GBP' => 'British Pound',
        'CAD' => 'Canadian Dollar',
        'AUD' => 'Australian Dollar',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($organization) {
            $organization->ulid = Str::ulid();
        });
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_users')
            ->withTimestamps();
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    public function getInviteLinkAttribute(): string
    {
        return route('organizations.join', $this->ulid);
    }
}
