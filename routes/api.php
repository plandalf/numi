<?php

use App\Http\Controllers\OfferSlotsController;
use Illuminate\Support\Facades\Route;

Route::group([
    'prefix' => 'store/',
    'as' => 'store.',
], function () {
    Route::resource('offers.slots', OfferSlotsController::class);
});
