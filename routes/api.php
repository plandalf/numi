<?php

use App\Http\Controllers\OfferItemsController;
use Illuminate\Support\Facades\Route;

Route::group([
    'prefix' => 'store/',
    'as' => 'store.',
], function () {
    // Route::resource('offers.items', OfferItemsController::class);
});

// get a checkout session

// hosted-page

// different for different shares?

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
