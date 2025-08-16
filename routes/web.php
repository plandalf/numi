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
use App\Http\Controllers\OrderStatusController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\ReusableBlockController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\WebhookController;
use App\Models\Integration;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\OfferItemPriceController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ApiKeysController;
use App\Http\Controllers\ImpersonationController;
use App\Http\Controllers\PricingController;


Route::get('test', function (\Illuminate\Http\Request $request) {
});

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['frame-embed'])->group(function () {
    Route::get('/o/{offer}/{environment?}', [CheckoutController::class, 'initialize'])
        ->name('offers.show')
        ->where('environment', 'live|test');

    Route::get('/checkout/{checkout}', [CheckoutController::class, 'show'])
        ->name('checkouts.show');
});

Route::middleware(['frame-embed'])
    ->group(function () {
        // Init new checkout
        Route::get('/o/{offer}/{environment?}', [CheckoutController::class, 'initialize'])
            ->name('offers.show')
            ->where('environment', 'live|test');

        // Show checkout
        Route::get('/checkout/{checkout}', [CheckoutController::class, 'show'])
            ->name('checkouts.show');

        Route::get('/checkout/{session}/callback', [CheckoutController::class, 'callback'])
            ->name('checkout.redirect.callback');

        Route::post('/checkouts/{checkoutSession}/mutations', [CheckoutSessionController::class, 'storeMutation'])
            ->name('checkouts.mutations.store');

        Route::get('/order-status/{order}', OrderStatusController::class)
            ->name('order-status.show')
            ->middleware('signed');
    });

// Social image generation route (signed URL required)
Route::get('/social-image/{offer}', [\App\Http\Controllers\SocialImageController::class, 'generate'])
    ->name('social-image.generate');

// Internal route to generate signed order status URL for admins
Route::get('/admin/order-status/{order}/public', [OrderStatusController::class, 'generatePublicUrl'])
    ->name('order-status.public-url')
    ->middleware(['auth', 'organization']);

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
                        });

                        // Checkout completion routes
                        Route::prefix('checkout-completion')->name('checkout-completion.')->group(function () {
                            Route::get('/{checkoutId}', [\App\Http\Controllers\CheckoutCompletionController::class, 'show'])->name('show');
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
        Route::post('products/{product}/transition', [ProductsController::class, 'transitionState'])->name('products.transition');
        Route::post('products/{product}/version', [ProductsController::class, 'createVersion'])->name('products.version');
        Route::post('products/{product}/prices/import', [PriceController::class, 'import'])->name('products.prices.import');
        Route::resource('products.prices', PriceController::class);

        Route::get('/integrations/{integrationType}/callback', [IntegrationsController::class, 'callback']);
        Route::post('/integrations/{integrationType}/authorizations', [IntegrationsController::class, 'authorizeIntegration']);
        Route::get('/integrations/{integration}/products', [IntegrationsController::class, 'products'])->name('integrations.products');
        Route::get('/integrations/{integration}/products/{gatewayProductId}/prices', [IntegrationsController::class, 'prices'])->name('integrations.prices');
        Route::put('/integrations/{integration}/payment-methods', [IntegrationsController::class, 'updatePaymentMethods'])->name('integrations.payment-methods.update');
        Route::resource('integrations', IntegrationsController::class);

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

        // Pricing table
        Route::get('/pricing', [PricingController::class, 'index'])->name('pricing.index');

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

// Media routes
Route::middleware(['auth'])->group(function () {
    Route::get('/medias', [MediaController::class, 'index'])->name('medias.index');
    Route::post('/medias/upload-url', [MediaController::class, 'generateUploadUrl'])->name('medias.upload-url');
    Route::put('/medias/{media}/upload', [MediaController::class, 'upload'])->name('medias.upload');
    Route::post('/medias/{media}/finalize', [MediaController::class, 'finalizeUpload'])->name('medias.finalize');
});

Route::get('m/{dir}/{media}.{extension}', function (string $dir, \App\Models\Media $media) {
    return redirect()->away($media->getSignedUrl());
})->name('media.show')->where('extension', '[a-zA-Z]+');

// Webhook endpoints (public, no authentication required)
Route::prefix('hooks')
    ->name('webhooks.')
    ->group(function () {
        Route::any('catch/{sequence}/{trigger}', [WebhookController::class, 'handleTrigger'])
            ->name('trigger');
    });

Route::post('/feedback', [FeedbackController::class, 'submit'])->name('feedback.submit');

Route::get('/orders/{uuid}/receipt', [App\Http\Controllers\OrderController::class, 'receipt'])
    ->name('orders.receipt')
    ->middleware('signed');

// Test route for receipt generation (remove in production)
Route::get('/test-receipt/{uuid}', function($uuid) {
    $order = \App\Models\Order\Order::where('uuid', $uuid)->first();
    if (!$order) {
        return 'Order not found';
    }
    return redirect($order->getReceiptUrl());
})->name('test.receipt');



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

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
require __DIR__.'/automation.php';

