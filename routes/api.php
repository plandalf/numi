<?php

use App\Http\Controllers\OfferItemsController;
use Illuminate\Support\Facades\Route;

Route::group([
    'prefix' => 'store/',
    'as' => 'store.',
], function () {
    // Route::resource('offers.items', OfferItemsController::class);
});
