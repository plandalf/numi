<?php

namespace App\Providers;

use App\Enums\OnboardingStep;
use App\Models\Integration;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\Theme;
use App\Observers\IntegrationObserver;
use App\Observers\OfferObserver;
use App\Observers\ThemeObserver;
use App\Models\Subscription;
use App\Models\SubscriptionItem;
use App\Models\Order\Order;
use App\Policies\OrderPolicy;
use Carbon\CarbonImmutable;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Cashier\Cashier;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(Organization::class, function ($app) {
            return $app->make(Request::class)->user()?->currentOrganization;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::$wrap = null;

        Cashier::useCustomerModel(Organization::class);
        Cashier::useSubscriptionModel(Subscription::class);
        Cashier::useSubscriptionItemModel(SubscriptionItem::class);

        $this->bootModelRules();
        $this->bootInertiaSharing();
        $this->bootObservers();
        $this->bootPolicies();

        Vite::useAggressivePrefetching();
        URL::forceHttps(app()->isProduction());
        Model::automaticallyEagerLoadRelationships();
        Date::use(CarbonImmutable::class);
        DB::prohibitDestructiveCommands(app()->isProduction());
        Password::defaults(fn (): ?Password => app()->isProduction() ? Password::min(8)->max(255)->uncompromised() : null);

        Scramble::configure()
            ->withDocumentTransformers(function (OpenApi $openApi) {
                $openApi->secure(SecurityScheme::http('bearer'),);
            });
    }

    private function bootModelRules(): void
    {
        // As these are concerned with application correctness,
        // leave them enabled all the time.
        Model::preventAccessingMissingAttributes();
        Model::preventSilentlyDiscardingAttributes();

        // Since this is a performance concern only, don't halt
        // production for violations.
        Model::preventLazyLoading();

        // But in production, log the violation instead of throwing an exception.
        if ($this->app->isProduction()) {
            Model::handleLazyLoadingViolationUsing(function ($model, $relation) {
                Log::notice('AppServiceProvider@boot.handleLazyLoadingViolationUsing', [
                    'message' => 'Attempted to lazy load',
                    'relation' => $relation,
                    'model' => get_class($model),
                    'path' => $this->app->runningInConsole() ? null : request()->path(),
                ]);
            });
        }
    }

    private function bootInertiaSharing(): void
    {
        Inertia::share([
            'onboarding' => function (Request $request) {
                if (!$request->user() || !$request->user()->currentOrganization) {
                    return null;
                }

                $organization = $request->user()->currentOrganization;

                $steps = collect(OnboardingStep::cases())->map(function ($step) use ($organization) {
                    return [
                        'key' => $step->key(),
                        'label' => $step->label(),
                        'description' => $step->description(),
                        'completed' => $organization->isOnboardingStepCompleted($step),
                        'value' => $step->value,
                    ];
                });

                return [
                    'steps' => $steps,
                    'completion_percentage' => $organization->getOnboardingCompletionPercentage(),
                    'is_complete' => $organization->isOnboardingComplete(),
                    'completed_steps' => $organization->getCompletedOnboardingSteps(),
                    'incomplete_steps' => $organization->getIncompleteOnboardingSteps(),
                    'user_info_seen' => $request->user()->getSeenOnboardingInfo(),
                    'user_info_unseen' => $request->user()->getUnseenOnboardingInfo(),
                ];
            },
        ]);
    }

    private function bootObservers(): void
    {
        Offer::observe(OfferObserver::class);
        Integration::observe(IntegrationObserver::class);
        Theme::observe(ThemeObserver::class);
    }

    private function bootPolicies(): void
    {
        Gate::policy(Order::class, OrderPolicy::class);
    }
}
