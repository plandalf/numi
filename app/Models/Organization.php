<?php

namespace App\Models;

use App\Models\Store\Offer;
use App\Models\Theme;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Laravel\Cashier\Billable;
use function Illuminate\Events\queueable;

class Organization extends Model
{
    /** @use HasFactory<\Database\Factories\OrganizationFactory> */
    use HasFactory, Billable;

    protected $fillable = [
        'name',
        'ulid',
        'default_currency',
        'join_token',
        'stripe_id',
        'pm_type',
        'pm_last_four',
        'trial_ends_at',
    ];

    protected $appends = [
        'invite_link',
    ];

    protected $attributes = [
        'default_currency' => 'USD',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
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

        // If the organization has no active subscription, create a new subscription in trial
        static::retrieved(function ($organization) {
            $trialDays = (int) config('cashier.trial_days');

            // Check if the organization has no active subscription
            if (!$organization->subscribed('default')) {
                $organization->update([
                    'trial_ends_at' => now()->addDays($trialDays),
                ]);
            
                // Create a new subscription in trial
                $organization
                    ->newSubscription('default', config('cashier.paid_price_id'))
                    ->trialDays($trialDays)
                    ->create();
            }
        });

        static::creating(function ($organization) {
            $organization->ulid = Str::ulid();
            $organization->join_token = hash('sha256', $organization->ulid);
        });

        static::updated(queueable(function (Organization $organization) {
            if ($organization->hasStripeId()) {
                $organization->syncStripeCustomerDetails();
            }
        }));
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_users')
            ->using(OrganizationUser::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    public function themes(): HasMany
    {
        return $this->hasMany(Theme::class);
    }

    public function getInviteLinkAttribute(): string
    {
        return route('auth.join', $this->join_token);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }
}
