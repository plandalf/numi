<?php

use App\Http\Controllers\Api\CheckoutSessionAPIController;
use App\Http\Controllers\Api\CustomerAPIController;
use App\Http\Controllers\Api\FulfillmentAPIController;
use App\Http\Controllers\Api\ProductAPIController;
use App\Http\Controllers\OfferItemsController;
use Illuminate\Support\Facades\Route;

// All API routes should return JSON responses
Route::middleware(['force-json', 'api-key'])->group(function () {
    // Protected API routes (require API key authentication)

    
    Route::prefix('v1')->name('api.v1.')->group(function () {
        Route::resource('checkouts', CheckoutSessionAPIController::class);
        Route::resource('customers', CustomerAPIController::class);

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

        // Fulfillment API endpoints
        Route::prefix('fulfillment')->name('fulfillment.')->group(function () {
            Route::post('/orders/{order}/resend-notification', [FulfillmentAPIController::class, 'resendNotification'])->name('orders.resend-notification');
            Route::post('/order-items/{orderItem}/update', [FulfillmentAPIController::class, 'provisionItem'])->name('order-items.update');
            Route::post('/order-items/{orderItem}/provision', [FulfillmentAPIController::class, 'provisionItem'])->name('order-items.provision');
            Route::post('/order-items/{orderItem}/mark-unprovisionable', [FulfillmentAPIController::class, 'markUnprovisionable'])->name('order-items.mark-unprovisionable');
            Route::patch('/order-items/{orderItem}/tracking', [FulfillmentAPIController::class, 'updateTracking'])->name('order-items.update-tracking');
        });

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

        // (reserved) additional v1 endpoints
    });
});

// App-authenticated API (session-based), not API-key based
Route::middleware(['web', 'auth', 'organization', 'force-json'])->group(function () {
    // RESTful Products API (session-authenticated)
    Route::apiResource('products', ProductAPIController::class);
});
