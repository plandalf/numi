<?php

namespace App\Providers;

use App\Observers\ExtendSocialiteObserver;
use App\Workflows\Automation\AutomationEventListener;
use App\Workflows\Automation\Events\AutomationTriggerEvent;
use App\Workflows\Automation\Events\SystemEvent;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        \SocialiteProviders\Manager\SocialiteWasCalled::class => [
            ExtendSocialiteObserver::class,
        ],
        AutomationTriggerEvent::class => [
            AutomationEventListener::class,
        ],
    ];

    protected $subscribe = [
        \App\Workflows\WorkflowEventListener::class,
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
