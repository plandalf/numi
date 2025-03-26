<?php

use App\Http\Controllers\OffersController;
use App\Http\Controllers\OrganizationController;
use App\Models\Store\Offer;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Organization setup route - no organization middleware
    Route::get('/organizations/setup', function () {
        return Inertia::render('organizations/setup');
    })->name('organizations.setup');

    // Organization routes
    Route::prefix('organizations')
        ->name('organizations.')
        ->group(function () {
            Route::post('/', [OrganizationController::class, 'store'])->name('store');
            Route::get('join/{ulid}', [OrganizationController::class, 'join'])->name('join');
            Route::post('switch/{organization}', [OrganizationController::class, 'switch'])->name('switch');
        });

    // Routes that require an organization
    Route::middleware(['organization'])->group(function () {
        // Offers routes
        Route::prefix('offers')->name('offers.')->group(function () {
            Route::post('/', [OffersController::class, 'store'])->name('store');
            
            Route::prefix('{offer}')->group(function () {
                Route::get('/edit', [OffersController::class, 'edit'])->name('edit');
                Route::put('/', [OffersController::class, 'update'])->name('update');
                Route::delete('/', [OffersController::class, 'destroy'])->name('destroy');
                
                // Offer tab routes
                Route::get('/pricing', [OffersController::class, 'pricing'])->name('pricing');
                Route::get('/integrate', [OffersController::class, 'integrate'])->name('integrate');
                Route::get('/sharing', [OffersController::class, 'sharing'])->name('sharing');
                Route::get('/settings', [OffersController::class, 'settings'])->name('settings');
                Route::get('/settings/customization', [OffersController::class, 'settingsCustomization'])->name('settings.customization');
                Route::get('/settings/notifications', [OffersController::class, 'settingsNotifications'])->name('settings.notifications');
                Route::get('/settings/access', [OffersController::class, 'settingsAccess'])->name('settings.access');
                Route::post('/publish', [OffersController::class, 'publish'])->name('publish');
            });
        });

        Route::get('dashboard', function () {
            return Inertia::render('dashboard', [
                'offers' => Offer::latest()->get(),
            ]);
        })->name('dashboard');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';


//
