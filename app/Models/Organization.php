<?php

namespace App\Models;

use App\Enums\OnboardingStep;
use App\Enums\FulfillmentMethod;
use App\Enums\DeliveryMethod;
use App\Models\Catalog\Price;
use App\Models\Order\Order;
use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use Laravel\Cashier\Billable;

use function Illuminate\Events\queueable;

/**
 * @property mixed $name
 * @property mixed $description
 * @property mixed $website_url
 * @property mixed $logo_media_id
 * @property mixed $favicon_media_id
 * @property mixed $primary_color
 * @property mixed $social_media
 * @property mixed $ulid
 * @property mixed $default_currency
 * @property mixed $join_token
 * @property mixed $stripe_id
 * @property mixed $pm_type
 * @property mixed $pm_last_four
 * @property mixed $trial_ends_at
 * @property mixed $checkout_success_url
 * @property mixed $checkout_cancel_url
 * @property mixed $subdomain
 * @property mixed $onboarding_mask
 * @property mixed $fulfillment_method
 * @property mixed $default_delivery_method
 * @property mixed $fulfillment_config
 * @property mixed $fulfillment_notification_email
 * @property mixed $auto_fulfill_orders
 * @property mixed $external_platform_config
 */
class Organization extends Model
{
    public const DEFAULT_SUBDOMAIN = 'checkout';
    /** @use HasFactory<\Database\Factories\OrganizationFactory> */
    use Billable, HasFactory;

    protected $fillable = [
        'name',
        'description',
        'website_url',
        'logo_media_id',
        'favicon_media_id',
        'primary_color',
        'social_media',
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
        'should_apply_region_currency',
    ];

    protected $appends = [
        'invite_link',
    ];

    protected $attributes = [
        'default_currency' => 'USD',
        'should_apply_region_currency' => false,
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'social_media' => 'array',
        'fulfillment_method' => FulfillmentMethod::class,
        'default_delivery_method' => DeliveryMethod::class,
        'fulfillment_config' => 'array',
        'auto_fulfill_orders' => 'boolean',
        'external_platform_config' => 'array',
        'should_apply_region_currency' => 'boolean',
    ];

    /**
     * Get available currencies from config
     */
    public static function getAvailableCurrencies(): array
    {
        return config('currencies.available', []);
    }

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

    public function hostedPages(): HasMany
    {
        return $this->hasMany(HostedPage::class);
    }

    public function logoMedia(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'logo_media_id');
    }

    public function faviconMedia(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'favicon_media_id');
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

    public function sequences(): HasMany
    {
        return $this->hasMany(\App\Models\Automation\Sequence::class);
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

        if ($this->subscribed()) {
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

    /**
     * Get currency based on country code from CloudFlare header
     */
    public function getRegionalCurrency(?string $countryCode): ?string
    {
        if (!$countryCode || !$this->should_apply_region_currency) {
            return null;
        }

        $countryMapping = config('currencies.country_mapping', []);
        $availableCurrencies = config('currencies.available', []);

        $currency = $countryMapping[$countryCode] ?? null;

        // Only return currencies that are available for this organization
        if ($currency && array_key_exists($currency, $availableCurrencies)) {
            return $currency;
        }

        return null;
    }

    public function prices(): HasMany
    {
        return $this->hasMany(Price::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
