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



    // Webhook routes (no authentication required)
    // Route::prefix('webhooks')->name('webhooks.')->group(function () {
    //     Route::post('/organizations/{organization}/shopify', [\App\Http\Controllers\Api\WebhookController::class, 'shopify'])->name('shopify');
    //     Route::post('/organizations/{organization}/etsy', [\App\Http\Controllers\Api\WebhookController::class, 'etsy'])->name('etsy');
    //     Route::post('/organizations/{organization}/clickfunnels', [\App\Http\Controllers\Api\WebhookController::class, 'clickfunnels'])->name('clickfunnels');
    //     Route::post('/organizations/{organization}/woocommerce', [\App\Http\Controllers\Api\WebhookController::class, 'woocommerce'])->name('woocommerce');
    //     Route::post('/organizations/{organization}/amazon', [\App\Http\Controllers\Api\WebhookController::class, 'amazon'])->name('amazon');
    //     Route::post('/organizations/{organization}/custom', [\App\Http\Controllers\Api\WebhookController::class, 'custom'])->name('custom');
    // });

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

        // Fulfillment API endpoints
        Route::prefix('fulfillment')->name('fulfillment.')->group(function () {
            // Route::get('/', [\App\Http\Controllers\Api\FulfillmentController::class, 'index'])->name('index');
            // Route::get('/statistics', [\App\Http\Controllers\Api\FulfillmentController::class, 'statistics'])->name('statistics');
            // Route::get('/orders/{order}', [\App\Http\Controllers\Api\FulfillmentController::class, 'show'])->name('orders.show');
            
            Route::post('/orders/{order}/resend-notification', [\App\Http\Controllers\Api\FulfillmentController::class, 'resendNotification'])->name('orders.resend-notification');
            
            // Comprehensive fulfillment update (matches UI form)
            Route::post('/order-items/{orderItem}/update', [\App\Http\Controllers\Api\FulfillmentController::class, 'provisionItem'])->name('order-items.update');
            
            // Legacy endpoints (keeping for backward compatibility)
            Route::post('/order-items/{orderItem}/provision', [\App\Http\Controllers\Api\FulfillmentController::class, 'provisionItem'])->name('order-items.provision');
            Route::post('/order-items/{orderItem}/mark-unprovisionable', [\App\Http\Controllers\Api\FulfillmentController::class, 'markUnprovisionable'])->name('order-items.mark-unprovisionable');
            Route::patch('/order-items/{orderItem}/tracking', [\App\Http\Controllers\Api\FulfillmentController::class, 'updateTracking'])->name('order-items.update-tracking');
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
