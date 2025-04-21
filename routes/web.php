<?php

use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\IntegrationsController;
use App\Http\Controllers\OffersController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\Settings\ProfileController;
use App\Models\Store\Offer;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\TemplateController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// get offer controller 
// redirect to 
Route::get('/o/{offer}/{environment?}', [CheckoutController::class, 'initialize'])
    ->name('offers.show')
    ->where('environment', 'live|test');

Route::get('/checkout/checkout}', [CheckoutController::class, 'show'])
    ->name('checkouts.show');

// Route::get('/checkout/{checkout}', [CheckoutController::class, 'show'])
// ->name('offers.show')
// ->where('environment', 'live|test');

Route::post('/checkouts/{checkout}/mutations', [CheckoutController::class, 'storeMutation'])
    ->name('checkouts.mutations.store')
    ->middleware(['web']);

Route::middleware(['auth', 'verified'])->group(function () {
    // Organization setup route - no organization middleware
    Route::get('/organizations/setup', function () {
        return Inertia::render('organizations/setup');
    })->name('organizations.setup');

    // Organization routes
    Route::prefix('organizations')->name('organizations.')->group(function () {
        Route::post('/', [OrganizationController::class, 'store'])->name('store');
        Route::post('switch/{organization}', [OrganizationController::class, 'switch'])->name('switch');
        Route::put('/{organization}', [OrganizationController::class, 'update'])->name('update');

        // Organization settings routes
        Route::middleware(['organization'])->group(function () {
            Route::prefix('settings')->name('settings.')->group(function () {
                Route::get('/', [OrganizationController::class, 'settings'])->name('general');
                Route::get('/team', [OrganizationController::class, 'team'])->name('team');
                Route::get('/billing', [OrganizationController::class, 'billing'])->name('billing');
                Route::delete('/team/{user}', [OrganizationController::class, 'removeTeamMember'])->name('team.remove');
            });
        });
    });

    // Routes that require an organization
    Route::middleware(['organization'])->group(function () {

        Route::resource('products', ProductsController::class);
        Route::resource('products.prices', PriceController::class);

        Route::get('/integrations/{integrationType}/callback', [IntegrationsController::class, 'callback']);
        Route::post('/integrations/{integrationType}/authorizations', [IntegrationsController::class, 'authorize']);
        Route::resource('integrations', IntegrationsController::class);

        // Offers routes
        Route::resource('offers', OffersController::class)->except(['show', 'create']);

        Route::prefix('offers/{offer}')->name('offers.')->group(function () {
            Route::get('pricing', [OffersController::class, 'pricing'])->name('pricing');

            Route::get('settings/theme', [OffersController::class, 'settingsTheme'])->name('settings.theme');
            Route::put('theme', [OffersController::class, 'updateTheme'])->name('update.theme');

            // Add Slot routes
            Route::post('/slots', [OffersController::class, 'storeSlot'])->name('slots.store');
            Route::put('/slots/{slot}', [OffersController::class, 'updateSlot'])->name('slots.update');
            // Route::delete('/slots/{slot}', [OffersController::class, 'destroySlot'])->name('slots.destroy'); // Add if needed

            Route::get('integrate', [OffersController::class, 'integrate'])->name('integrate');
            Route::get('sharing', [OffersController::class, 'sharing'])->name('sharing');
            Route::get('settings', [OffersController::class, 'settings'])->name('settings');
            Route::get('settings/customization', [OffersController::class, 'settingsCustomization'])->name('settings.customization');
            Route::get('settings/notifications', [OffersController::class, 'settingsNotifications'])->name('settings.notifications');
            Route::get('settings/access', [OffersController::class, 'settingsAccess'])->name('settings.access');
            Route::post('publish', [OffersController::class, 'publish'])->name('publish');
        });

        Route::get('dashboard', function () {
            return Inertia::render('dashboard', [
                'offers' => Offer::latest()->get(),
            ]);
        })->name('dashboard');
    });

    // Media Upload Route
    Route::post('media', [MediaController::class, 'store'])->name('media.store');

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');
    Route::post('/templates/{template}/use', [TemplateController::class, 'useTemplate'])->name('templates.use');
});

// Media routes
Route::middleware(['auth'])->group(function () {
    Route::post('/medias/upload-url', [MediaController::class, 'generateUploadUrl'])->name('medias.upload-url');
    Route::post('/medias/{media}/finalize', [MediaController::class, 'finalizeUpload'])->name('medias.finalize');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';


//
