<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\OnboardingInfo;
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
        'current_organization_id',
        'onboarding_info_mask',
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
        return $this->belongsTo(Organization::class, 'current_organization_id')->with('subscriptions');
    }

    public function switchOrganization(Organization $organization): void
    {
        if (! $organization->users()->where('organization_users.user_id', $this->id)->exists()) {
            throw new \Exception('User does not belong to this organization');
        }

        $this->current_organization_id = $organization->id;
        $this->save();
    }

    // Switch to the first available organization
    public function switchToAvailableOrganization(): void
    {
        $availableOrganization = $this->organizations()->first();
        $this->current_organization_id = $availableOrganization ? $availableOrganization->id : null;
        $this->save();
    }

    /**
     * Check if a specific informational onboarding item has been seen
     */
    public function hasSeenOnboardingInfo(OnboardingInfo $item): bool
    {
        return ($this->onboarding_info_mask & $item->value) === $item->value;
    }

    /**
     * Mark an informational onboarding item as seen
     */
    public function markOnboardingInfoSeen(OnboardingInfo $item): void
    {
        $this->onboarding_info_mask |= $item->value;
        $this->save();
    }

    /**
     * Mark an informational onboarding item as unseen
     */
    public function markOnboardingInfoUnseen(OnboardingInfo $item): void
    {
        $this->onboarding_info_mask &= ~$item->value;
        $this->save();
    }

    /**
     * Get all seen informational onboarding items
     */
    public function getSeenOnboardingInfo(): array
    {
        $seen = [];
        foreach (OnboardingInfo::cases() as $item) {
            if ($this->hasSeenOnboardingInfo($item)) {
                $seen[] = $item->key();
            }
        }
        return $seen;
    }

    /**
     * Get all unseen informational onboarding items
     */
    public function getUnseenOnboardingInfo(): array
    {
        $unseen = [];
        foreach (OnboardingInfo::cases() as $item) {
            if (!$this->hasSeenOnboardingInfo($item)) {
                $unseen[] = $item->key();
            }
        }
        return $unseen;
    }
}
