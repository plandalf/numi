<?php

namespace App\Providers;

use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;

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
        JsonResource::$wrap = false;

        Cashier::useCustomerModel(Organization::class);
        Cashier::useSubscriptionModel(Subscription::class);
        Cashier::useSubscriptionItemModel(SubscriptionItem::class);

        $this->bootModelRules();
    }

    private function bootModelRules(): void
    {
        // As these are concerned with application correctness,
        // leave them enabled all the time.
        Model::preventAccessingMissingAttributes();
        Model::preventSilentlyDiscardingAttributes();

        // Since this is a performance concern only, don’t halt
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
}
