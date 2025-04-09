<?php

use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Client\CheckoutSessionController;
use App\Http\Controllers\OffersController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\Settings\ProfileController;
use App\Models\Store\Offer;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\PriceController;

// Client routes are public and don't require CSRF protection
Route::group([
    'prefix' => '/client',
    'as' => 'client.',
], function () {
    Route::group([
        'prefix' => '/checkouts',
        'as' => 'checkouts.',
    ], function () {
        Route::post('/offers/{offer}', [CheckoutSessionController::class, 'store']);
        Route::resource('/', CheckoutSessionController::class);
        Route::post('/{checkoutSession}/commit', [CheckoutSessionController::class, 'commit']);
    });
});
