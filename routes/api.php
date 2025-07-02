<?php

use App\Http\Controllers\Api\CheckoutSessionAPIController;
use App\Http\Controllers\OfferItemsController;
use Illuminate\Support\Facades\Route;

// All API routes should return JSON responses
Route::middleware(['force-json'])->group(function () {
    Route::group([
        'prefix' => 'store/',
        'as' => 'store.',
    ], function () {
        // Route::resource('offers.items', OfferItemsController::class);
    });

    // get a checkout session

    // hosted-page

    // different for different shares?



    // Protected API routes (require API key authentication)
    Route::middleware(['api-key'])->group(function () {
    Route::resource('checkout_sessions', CheckoutSessionAPIController::class);
    Route::resource('customers', \App\Http\Controllers\Api\CustomerAPIController::class);
    
    Route::prefix('v1')->name('api.v1.')->group(function () {
        Route::get('orders', function () {
            $organization = request('api_organization');
            return response()->json([
                'message' => 'This is the authenticated orders endpoint',
                'organization' => $organization->name,
                'data' => [],
            ]);
        })->name('orders.index');

        Route::get('/orders/{order}', function ($order) {
            $organization = request('api_organization');
            return response()->json([
                'message' => "This is the authenticated order endpoint for order {$order}",
                'organization' => $organization->name,
                'order_id' => $order,
            ]);
        })->name('orders.show');

        // Add more protected API endpoints here
        Route::get('organization', function () {
            $organization = request('api_organization');
            return response()->json([
                'id' => $organization->id,
                'name' => $organization->name,
                'ulid' => $organization->ulid,
                'default_currency' => $organization->default_currency,
            ]);
        })->name('organization.show');
    });
    });

    // Legacy routes (keeping for backward compatibility)
    Route::group([
        'as' => 'api.',
    ], function () {
        Route::get('orders', function () {
            return response()->json([
                'message' => 'This is the orders endpoint',
            ]);
        })->name('orders.index');

        Route::get('/orders/{order}', function ($order) {
            return response()->json([
                'message' => "This is the order endpoint for order {$order}",
            ]);
        })->name('orders.show');
    });
});
