<?php

use App\Http\Controllers\Automation\WorkflowsController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Automation\TriggersController;
use App\Http\Controllers\Automation\ActionController;
use App\Http\Controllers\Automation\TestController;
use App\Http\Controllers\Automation\IntegrationController;
use App\Http\Controllers\Automation\IntegrationSetupController;
use App\Http\Controllers\Automation\AppController;
use App\Http\Controllers\Automation\ResourceController;
use App\Http\Controllers\SequencesController;

Route::middleware(['auth', 'organization', 'subscription'])
    ->as('automation.')
    ->prefix('automation')->group(function () {
        Route::resource('sequences', SequencesController::class);

        Route::get('workflows', [WorkflowsController::class, 'index']);
        Route::get('workflows/{workflow}', [WorkflowsController::class, 'show']);
        Route::post('workflows/{workflow}/rerun', [WorkflowsController::class, 'rerun']);
        Route::post('workflows/{workflow}/force-rerun', [WorkflowsController::class, 'forceRerun']);

        Route::resource('triggers', TriggersController::class);
        Route::any('triggers/{trigger}/tests', [TriggersController::class, 'test']);
        Route::get('triggers/{trigger}/schema', [TriggersController::class, 'getSchema']);
        Route::resource('actions', ActionController::class);
        Route::any('actions/{action}/tests', [ActionController::class, 'test']);
        Route::get('actions/{action}/schema', [ActionController::class, 'getSchema']);
        Route::get('actions/fields/available', [ActionController::class, 'getAvailableFields']);

        // Integration management routes
        Route::resource('integrations', IntegrationController::class);
        Route::prefix('integrations')->group(function () {
            Route::post('/{id}/test', [IntegrationController::class, 'test'])->name('automation.integrations.test');

            // Legacy setup routes (can be removed later)
            Route::prefix('setup')->group(function () {
                Route::get('/', [IntegrationSetupController::class, 'setupPopup'])->name('integrations.setup.popup');
                Route::post('auth', [IntegrationSetupController::class, 'auth'])->name('integrations.setup.auth');
                Route::post('webhook', [IntegrationSetupController::class, 'webhook'])->name('integrations.setup.webhook');
            });
        });

        Route::get('apps', [AppController::class, 'index']);
        Route::get('apps/{app}/resources', [ResourceController::class, 'index']);
        Route::get('apps/{app}/resources/{resource}', [ResourceController::class, 'search']);
    });
