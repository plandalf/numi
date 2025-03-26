<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
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
