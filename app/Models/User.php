<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'current_organization_id'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'current_organization_id' => 'integer',
        ];
    }

    public function organizations(): BelongsToMany
    {
        return $this
            ->belongsToMany(Organization::class, 'organization_users')
            ->withTimestamps();
    }

    public function currentOrganization()
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    public function switchOrganization(Organization $organization): void
    {
        if (!$organization->users()->where('organization_users.user_id', $this->id)->exists()) {
            throw new \Exception('User does not belong to this organization');
        }

        $this->current_organization_id = $organization->id;
        $this->save();
    }

    // Switch to the first available organization
    public function switchToAvailableOrganization(): void
    {
        $availableOrganization = $this->organizations()->first();
        $this->current_organization_id = $availableOrganization?->id ?? null;
        $this->save();
    }
}
