<?php

use App\Http\Controllers\Api\CheckoutSessionController;
use App\Http\Controllers\Billing\CheckoutController as BillingCheckoutController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IntegrationsController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NoAccessController;
use App\Http\Controllers\OfferItemsController;
use App\Http\Controllers\OffersController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\ReusableBlockController;
use App\Http\Controllers\SequencesController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\OfferItemPriceController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ApiKeysController;
use App\Http\Controllers\ImpersonationController;

Route::redirect('/', '/dashboard')->name('home');

Route::get('test', function () {

    $kajabi = new \App\Apps\Kajabi\KajabiApp();
    $integration = \App\Models\Integration::find(1);

    dd(
        $integration,
        $kajabi->test($integration)
    );
});

Route::middleware(['frame-embed'])->group(function () {
    Route::get('/o/{offer}/{environment?}', [CheckoutController::class, 'initialize'])
        ->name('offers.show')
        ->where('environment', 'live|test');

    Route::get('/checkout/{checkout}', [CheckoutController::class, 'show'])
        ->name('checkouts.show');
});

// Social image generation route (signed URL required)
Route::get('/social-image/{offer}', [\App\Http\Controllers\SocialImageController::class, 'generate'])
    ->name('social-image.generate');
    // ->middleware(['signed']);

Route::post('/checkouts/{checkoutSession}/mutations', [CheckoutSessionController::class, 'storeMutation'])
    ->name('checkouts.mutations.store');

Route::middleware(['auth', 'verified'])->group(function () {
    // No access route
    Route::get('/no-access', [NoAccessController::class, '__invoke'])->name('no-access');

    // Organization setup route - no organization middleware
    Route::get('/organizations/setup', function () {
        return Inertia::render('organizations/setup');
    })->name('organizations.setup');

    // Organization routes
    Route::prefix('organizations')
        ->name('organizations.')
        ->group(function () {
            Route::post('/', [OrganizationController::class, 'store'])->name('store');
            Route::post('switch/{organization}', [OrganizationController::class, 'switch'])->name('switch');
            Route::put('/{organization}', [OrganizationController::class, 'update'])->name('update');

            // Organization settings routes
            Route::middleware(['organization', 'subscription'])
                ->group(function () {
                    Route::prefix('settings')->name('settings.')->group(function () {
                        Route::get('/', [OrganizationController::class, 'settings'])->name('general');
                        Route::get('/team', [OrganizationController::class, 'team'])->name('team');
                        Route::delete('/team/{user}', [OrganizationController::class, 'removeTeamMember'])->name('team.remove');
                        Route::get('/seo', [OrganizationController::class, 'seoSettings'])->name('seo');
                        Route::put('/seo', [OrganizationController::class, 'updateSeoSettings'])->name('seo.update');

                        // API Keys routes
                        Route::prefix('api-keys')->name('api-keys.')->group(function () {
                            Route::get('/', [ApiKeysController::class, 'index'])->name('index');
                            Route::post('/', [ApiKeysController::class, 'store'])->name('store');
                            Route::put('/{apiKey}', [ApiKeysController::class, 'update'])->name('update');
                            Route::post('/{apiKey}/archive', [ApiKeysController::class, 'archive'])->name('archive');
                            Route::post('/{apiKey}/activate', [ApiKeysController::class, 'activate'])->name('activate');
                            Route::delete('/{apiKey}', [ApiKeysController::class, 'destroy'])->name('destroy');
                            Route::post('/{apiKey}/reveal', [ApiKeysController::class, 'reveal'])->name('reveal');
                        });

                        Route::prefix('billing')->name('billing.')->group(function () {
                            Route::get('/', [BillingCheckoutController::class, 'billing'])->name('index');
                            Route::get('/portal', [BillingCheckoutController::class, 'portal'])->name('portal');
                        });

                        Route::get('/fulfillment', [OrganizationController::class, 'fulfillment'])->name('fulfillment');
                        Route::put('/fulfillment', [OrganizationController::class, 'updateFulfillment'])->name('fulfillment.update');
                        Route::post('/fulfillment/test-email', [OrganizationController::class, 'sendTestFulfillmentEmail'])->name('fulfillment.test-email');
                    });
                });


            Route::get('/themes', [ThemeController::class, 'index'])->name('themes.index');
            Route::post('/themes', [ThemeController::class, 'store'])->name('themes.store');
            Route::put('/themes/{theme}', [ThemeController::class, 'update'])->name('themes.update');
            Route::get('/themes/{theme}', [ThemeController::class, 'edit'])->name('themes.edit');
            Route::delete('/themes/{theme}', [ThemeController::class, 'destroy'])->name('themes.destroy');

        });

    // Routes that require an organization
    Route::middleware(['organization', 'subscription'])->group(function () {

        Route::resource('products', ProductsController::class);
        Route::post('products/{product}/prices/import', [PriceController::class, 'import'])->name('products.prices.import');
        Route::resource('products.prices', PriceController::class);


        // todo: prefix all this with /automation (the module)

        // automation/sequences
        // automation/apps

        // Test-specific routes that match the test expectations (must come before resource routes)
        Route::prefix('sequences')->name('sequences.')->group(function () {
            Route::get('/discovered-apps', [SequencesController::class, 'getDiscoveredApps'])->name('discovered-apps');
            Route::get('/discovered-actions', [SequencesController::class, 'getDiscoveredActions'])->name('discovered-actions');
            Route::get('/discovered-triggers', [SequencesController::class, 'getDiscoveredTriggers'])->name('discovered-triggers');
            Route::get('/discovered-resources', [SequencesController::class, 'getDiscoveredResources'])->name('discovered-resources');
            Route::get('/resource-search/{resource}', [SequencesController::class, 'searchResource'])->name('resource-search');
            Route::post('/test-action-config', [SequencesController::class, 'testActionConfig'])->name('test-action-config');
        });

        Route::resource('sequences', SequencesController::class);

        // Sequences automation routes
        Route::prefix('sequences/{sequence}')->name('sequences.')->group(function () {
            Route::get('/apps', [SequencesController::class, 'getApps'])->name('apps.index');
            Route::get('/triggers/{trigger}', [SequencesController::class, 'showTrigger'])->name('triggers.show');
            Route::post('/triggers', [SequencesController::class, 'storeTrigger'])->name('triggers.store');
            Route::put('/triggers/{trigger}', [SequencesController::class, 'updateTrigger'])->name('triggers.update');
            Route::delete('/triggers/{trigger}', [SequencesController::class, 'destroyTrigger'])->name('triggers.destroy');
            Route::post('/triggers/{trigger}/test', [SequencesController::class, 'testTrigger'])->name('triggers.test');
            Route::get('/actions/{node}', [SequencesController::class, 'showAction'])->name('actions.show');
            Route::post('/actions', [SequencesController::class, 'storeAction'])->name('actions.store');
            Route::put('/actions/{node}', [SequencesController::class, 'updateAction'])->name('actions.update');
            Route::delete('/actions/{node}', [SequencesController::class, 'destroyAction'])->name('actions.destroy');
            Route::post('/actions/{node}/test', [SequencesController::class, 'testAction'])->name('actions.test');
            Route::post('/actions/test', [SequencesController::class, 'testActionConfig'])->name('actions.test-config');
        });

        // Apps and automation API routes
        Route::prefix('apps')->name('apps.')->group(function () {
            Route::get('/', [SequencesController::class, 'getApps'])->name('index');
            Route::get('/{app}', [SequencesController::class, 'getApp'])->name('show');
            Route::get('/{app}/triggers', [SequencesController::class, 'getAppTriggers'])->name('triggers');
            Route::get('/{app}/actions', [SequencesController::class, 'getAppActions'])->name('actions');
        });

        // todo: do discovery later.

        // Discovered app actions and triggers routes
        Route::prefix('discovered')->name('discovered.')->group(function () {
            Route::get('/actions', [SequencesController::class, 'getDiscoveredActions'])->name('actions');
            Route::get('/triggers', [SequencesController::class, 'getDiscoveredTriggers'])->name('triggers');
            Route::get('/apps/{appName}/actions', [SequencesController::class, 'getDiscoveredAppActions'])->name('apps.actions');
            Route::get('/apps/{appName}/triggers', [SequencesController::class, 'getDiscoveredAppTriggers'])->name('apps.triggers');
            Route::get('/resources', [SequencesController::class, 'getDiscoveredResources'])->name('resources');
            Route::post('/resources/search', [SequencesController::class, 'searchResource'])->name('resources.search');
            Route::get('/debug', [SequencesController::class, 'debugDiscovery'])->name('debug');
        });


        // /integrations

        // Integration management for automation
        Route::prefix('automation-integrations')->name('automation-integrations.')->group(function () {
            Route::get('/', [SequencesController::class, 'getIntegrations'])->name('index');
            Route::post('/', [SequencesController::class, 'storeIntegration'])->name('store');
            Route::get('/credential-fields/{integrationType}', [SequencesController::class, 'getIntegrationCredentialFields'])->name('credential-fields');
            Route::get('/{integration:uuid}/test', [SequencesController::class, 'testIntegration'])->name('test');
            Route::get('/{integration:uuid}/triggers', [SequencesController::class, 'getIntegrationTriggers'])->name('triggers');
            Route::get('/{integration:uuid}/actions', [SequencesController::class, 'getIntegrationActions'])->name('actions');
            Route::post('/{integration:uuid}/actions/test', [SequencesController::class, 'testIntegrationAction'])->name('actions.test');
            Route::put('/{integration:uuid}', [SequencesController::class, 'updateIntegration'])->name('update');
            Route::delete('/{integration:uuid}', [SequencesController::class, 'destroyIntegration'])->name('destroy');
        });

        // ?
        // Webhook triggers (for webhook-only triggers without integrations
        // todo: delete! its a regular trigger
        Route::prefix('webhook-triggers')->name('webhook-triggers.')->group(function () {
            Route::post('/', [SequencesController::class, 'storeWebhookTrigger'])->name('store');
        });

        // todo
        Route::resource('integrations', IntegrationsController::class);
        // integrations/{id}/authorize
        // integrations/{id}/callback

        Route::get('/integrations/{integrationType}/callback', [IntegrationsController::class, 'callback']);
        Route::post('/integrations/{integrationType}/authorizations', [IntegrationsController::class, 'authorizeIntegration']);
        Route::get('/integrations/{integration}/products', [IntegrationsController::class, 'products'])->name('integrations.products');
        Route::get('/integrations/{integration}/products/{gatewayProductId}/prices', [IntegrationsController::class, 'prices'])->name('integrations.prices');
        Route::put('/integrations/{integration}/payment-methods', [IntegrationsController::class, 'updatePaymentMethods'])->name('integrations.payment-methods.update');


        // Onboarding routes
        Route::prefix('onboarding')->name('onboarding.')->group(function () {
            Route::get('/', [OnboardingController::class, 'index'])->name('index');
            Route::patch('/steps/{stepKey}', [OnboardingController::class, 'updateStep'])->name('steps.update');
            Route::post('/steps/{stepKey}/complete', [OnboardingController::class, 'completeStep'])->name('steps.complete');
            Route::patch('/bulk-update', [OnboardingController::class, 'bulkUpdate'])->name('bulk-update');
            Route::post('/reset', [OnboardingController::class, 'reset'])->name('reset');

            // Informational onboarding routes
            Route::get('/info', [OnboardingController::class, 'getInfoStatus'])->name('info.index');
            Route::post('/info/{infoKey}/seen', [OnboardingController::class, 'markInfoSeen'])->name('info.seen');
        });

        // Offers routes
        Route::resource('offers', OffersController::class)->except(['show', 'create']);

        Route::prefix('offers/{offer}')->name('offers.')->group(function () {
            Route::get('pricing', [OffersController::class, 'pricing'])->name('pricing');

            Route::put('theme', [OffersController::class, 'updateTheme'])->name('update.theme');

            // Add offerItem routes
            Route::resource('items', OfferItemsController::class)->names('items');
            Route::put('items/{item}/prices/{price}', [OfferItemPriceController::class, 'update'])->name('items.prices.update');

            Route::get('integrate', [OffersController::class, 'integrate'])->name('integrate');
            Route::post('publish', [OffersController::class, 'publish'])->name('publish');
            Route::put('duplicate', [OffersController::class, 'duplicate'])->name('duplicate');
        });

        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');
        Route::post('/templates', [TemplateController::class, 'store'])->name('templates.store');
        Route::put('/templates/{template}', [TemplateController::class, 'update'])->name('templates.update');
        Route::post('/templates/{template}/use', [TemplateController::class, 'useTemplate'])->name('templates.use');
        Route::post('/templates/request', [TemplateController::class, 'requestTemplate'])->name('templates.request');

        // Media Upload Route
        Route::post('media', [MediaController::class, 'store'])->name('media.store');

        // Reusable Blocks routes (replacing block-library routes)
        Route::prefix('reusable-blocks')->name('reusable-blocks.')->group(function () {
            Route::get('/', [ReusableBlockController::class, 'index'])->name('index');
            Route::post('/', [ReusableBlockController::class, 'store'])->name('store');
            Route::delete('/{reusableBlock}', [ReusableBlockController::class, 'destroy'])->name('destroy');
            Route::post('/{reusableBlock}/use', [ReusableBlockController::class, 'use'])->name('use');
        });

        // Profile Routes
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        // Orders
        Route::prefix('orders')->name('orders.')->group(function () {
            Route::get('/', [OrdersController::class, 'index'])->name('index');
            Route::get('/{order}', [OrdersController::class, 'show'])->name('show');

            // Fulfillment routes
            Route::get('/{order}/fulfillment', [OrdersController::class, 'fulfillment'])->name('fulfillment');
            Route::post('/{order}/items/{orderItem}/fulfillment', [OrdersController::class, 'updateFulfillment'])->name('fulfillment.item.update');
            Route::post('/{order}/items/{orderItem}/unprovisionable', [OrdersController::class, 'markUnprovisionable'])->name('fulfillment.item.unprovisionable');
        });
    });
});

Route::middleware(['auth', 'organization'])->group(function () {
    Route::get('organizations/settings/billing/checkout', [BillingCheckoutController::class, 'checkout'])
        ->name('organizations.settings.billing.checkout');
});

// Media routes
Route::middleware(['auth'])->group(function () {
    Route::get('/medias', [MediaController::class, 'index'])->name('medias.index');
    Route::post('/medias/upload-url', [MediaController::class, 'generateUploadUrl'])->name('medias.upload-url');
    Route::put('/medias/{media}/upload', [MediaController::class, 'upload'])->name('medias.upload');
    Route::post('/medias/{media}/finalize', [MediaController::class, 'finalizeUpload'])->name('medias.finalize');
});

Route::get('m/{dir}/{media}.{extension}', function (string $dir, \App\Models\Media $media) {
    $url = config('app.s3_url') . $media->path;

    return redirect($url);
})->name('media.show')->where('extension', '[a-zA-Z]+');

// Webhook endpoints (public, no authentication required)
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    Route::any('/{trigger_uuid}', [WebhookController::class, 'handleTrigger'])
        ->name('trigger')
        ->where('trigger_uuid', '[0-9a-f-]{36}');
});

// Feedback route
Route::post('feedback', [FeedbackController::class, 'store'])->name('feedback.store');

// Authentication routes
require __DIR__.'/auth.php';

// Impersonation routes - LOCAL DEVELOPMENT ONLY
if (app()->environment('local')) {
    Route::prefix('dev')->group(function () {
        Route::get('/impersonate', [ImpersonationController::class, 'impersonate'])
            ->name('impersonate')
            ->middleware('signed');

        Route::post('/stop-impersonation', [ImpersonationController::class, 'stopImpersonation'])
            ->name('stop-impersonation');
    });
}

require __DIR__.'/settings.php';
