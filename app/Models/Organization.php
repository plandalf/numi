<?php

namespace App\Models;

use App\Enums\OnboardingStep;
use App\Enums\FulfillmentMethod;
use App\Enums\DeliveryMethod;
use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use Laravel\Cashier\Billable;

use function Illuminate\Events\queueable;

/**
 * @property string|null $checkout_success_url
 * @property string|null $checkout_cancel_url
 */
class Organization extends Model
{
    public const DEFAULT_SUBDOMAIN = 'checkout';
    /** @use HasFactory<\Database\Factories\OrganizationFactory> */
    use Billable, HasFactory;

    protected $fillable = [
        'name',
        'ulid',
        'default_currency',
        'join_token',
        'stripe_id',
        'pm_type',
        'pm_last_four',
        'trial_ends_at',
        'checkout_success_url',
        'checkout_cancel_url',
        'subdomain',
        'onboarding_mask',
        'fulfillment_method',
        'default_delivery_method',
        'fulfillment_config',
        'fulfillment_notification_email',
        'auto_fulfill_orders',
        'external_platform_config',
    ];

    protected $appends = [
        'invite_link',
    ];

    protected $attributes = [
        'default_currency' => 'USD',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'fulfillment_method' => FulfillmentMethod::class,
        'default_delivery_method' => DeliveryMethod::class,
        'fulfillment_config' => 'array',
        'auto_fulfill_orders' => 'boolean',
        'external_platform_config' => 'array',
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

    public function hostedPage(): HasOne
    {
        return $this->hasOne(HostedPage::class);
    }

    public function getInviteLinkAttribute(): string
    {
        return route('auth.join', $this->join_token);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    public function externalFulfillments(): HasMany
    {
        return $this->hasMany(ExternalFulfillment::class);
    }

    public function getTrialDaysLeftAttribute()
    {
        if (! config('cashier.enable_billing')) {
            return 0;
        }

        return $this->trial_ends_at ? ceil(now()->diffInDays($this->trial_ends_at)) : 0;
    }

    public function getSubscribedAttribute()
    {
        if (! config('cashier.enable_billing')) {
            return true;
        }

        return $this->subscribed();
    }

    public function getTrialPeriodExpiredAttribute()
    {
        if (! config('cashier.enable_billing')) {
            return false;
        }

        return $this->trial_ends_at && $this->trial_ends_at->isPast();
    }

    public function getOnTrialAttribute()
    {
        if (! config('cashier.enable_billing')) {
            return false;
        }

        return $this->onGenericTrial();
    }

    public function getSubdomainHost()
    {
        $appUrl = config('app.url');
        $baseDomain = parse_url($appUrl, PHP_URL_HOST);

        // Remove port from base domain if it exists
        if (str_contains($baseDomain, ':')) {
            $baseDomain = explode(':', $baseDomain)[0];
        }

        $subdomain = $this->subdomain ?? self::DEFAULT_SUBDOMAIN;

        return Str::lower($subdomain . '.' . $baseDomain);
    }

    /**
     * Check if a specific onboarding step is completed
     */
    public function isOnboardingStepCompleted(OnboardingStep $step): bool
    {
        return ($this->onboarding_mask & $step->value) === $step->value;
    }

    /**
     * Mark an onboarding step as completed
     */
    public function markOnboardingStepCompleted(OnboardingStep $step): void
    {
        $this->onboarding_mask |= $step->value;
        $this->save();
    }

    /**
     * Mark an onboarding step as incomplete
     */
    public function markOnboardingStepIncomplete(OnboardingStep $step): void
    {
        $this->onboarding_mask &= ~$step->value;
        $this->save();
    }

    /**
     * Get all completed onboarding steps
     */
    public function getCompletedOnboardingSteps(): array
    {
        $completed = [];
        foreach (OnboardingStep::cases() as $step) {
            if ($this->isOnboardingStepCompleted($step)) {
                $completed[] = $step->key();
            }
        }
        return $completed;
    }

    /**
     * Get all incomplete onboarding steps
     */
    public function getIncompleteOnboardingSteps(): array
    {
        $incomplete = [];
        foreach (OnboardingStep::cases() as $step) {
            if (!$this->isOnboardingStepCompleted($step)) {
                $incomplete[] = $step->key();
            }
        }
        return $incomplete;
    }

    /**
     * Get onboarding completion percentage
     */
    public function getOnboardingCompletionPercentage(): float
    {
        $totalSteps = count(OnboardingStep::cases());
        $completedSteps = count($this->getCompletedOnboardingSteps());
        
        return $totalSteps > 0 ? round(($completedSteps / $totalSteps) * 100, 2) : 0;
    }

    /**
     * Check if all onboarding steps are completed
     */
    public function isOnboardingComplete(): bool
    {
        return count($this->getIncompleteOnboardingSteps()) === 0;
    }
}
