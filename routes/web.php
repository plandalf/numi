<?php

use App\Http\Controllers\Api\CheckoutSessionController;
use App\Http\Controllers\Billing\CheckoutController as BillingCheckoutController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IntegrationsController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NoAccessController;
use App\Http\Controllers\OfferItemsController;
use App\Http\Controllers\OffersController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\SequencesController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\TemplateController;
use App\Models\ResourceEvent;
use App\Models\Store\Offer;
use App\Workflows\RunSequenceWorkflow;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Workflow\WorkflowStub;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\JavaScriptExecutionController;
use App\Http\Controllers\AutomationController;

Route::redirect('/', '/dashboard')->name('home');

Route::get('/workflow-test', function () {
    // Create a complete example automation as requested in the challenge
    
    // Create the sequence
    $sequence = \App\Models\Automation\Sequence::query()
        ->firstOrCreate([
            'name' => 'Order Confirmation Flow',
            'organization_id' => 1,
        ]);

    // Clean up existing nodes and edges for this sequence
    $sequence->edges()->delete();
    $sequence->nodes()->delete();
    $sequence->triggers()->delete();

    // 1. Send email to customer
    $customerEmail = \App\Models\Automation\Node::query()
        ->create([
            'sequence_id' => $sequence->id,
            'type' => 'email',
            'arguments' => [
                'subject' => 'Thanks for your order! 🎉',
                'recipients' => [
                    ['email' => '{{trigger.customer.email}}', 'name' => '{{trigger.customer.name}}'],
                ],
                'body' => 'Hi {{trigger.customer.name}},\n\nThanks for your order! We are processing it now and will send you an update soon.\n\nBest regards,\nThe Team',
            ],
        ]);

    // 2. Send email to us about the order
    $internalEmail = \App\Models\Automation\Node::query()
        ->create([
            'sequence_id' => $sequence->id,
            'type' => 'email',
            'arguments' => [
                'subject' => 'New Order Received - {{trigger.order.id}}',
                'recipients' => [
                    ['email' => 'team@example.com', 'name' => 'Order Team'],
                ],
                'body' => 'New order received:\n\nOrder ID: {{trigger.order.id}}\nCustomer: {{trigger.customer.name}} ({{trigger.customer.email}})\nAmount: {{trigger.order.amount}}\n\nPlease process this order.',
            ],
        ]);

    // 3. Custom function to fetch customer details from Stripe
    $stripeFunction = \App\Models\Automation\Node::query()
        ->create([
            'sequence_id' => $sequence->id,
            'type' => 'custom_function',
            'arguments' => [
                'code' => '// Fetch customer details from Stripe
const stripe = createStripe(context.stripe_secret_key);

try {
    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(context.trigger.customer.stripe_id);
    
    // Return enriched customer data
    return {
        success: true,
        customer: {
            ...context.trigger.customer,
            stripe_data: {
                created: customer.created,
                default_source: customer.default_source,
                invoice_settings: customer.invoice_settings,
                metadata: customer.metadata
            }
        }
    };
} catch (error) {
    return {
        success: false,
        error: error.message
    };
}',
                'timeout' => 30,
            ],
        ]);

    // 4. Send webhook to predetermined endpoint
    $webhook = \App\Models\Automation\Node::query()
        ->create([
            'sequence_id' => $sequence->id,
            'type' => 'webhook',
            'arguments' => [
                'url' => 'https://webhook.site/unique-id-here',
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer {{secrets.webhook_token}}',
                ],
                'body' => [
                    'event' => 'order.created',
                    'order' => [
                        'id' => '{{trigger.order.id}}',
                        'amount' => '{{trigger.order.amount}}',
                        'status' => '{{trigger.order.status}}',
                    ],
                    'customer' => [
                        'id' => '{{trigger.customer.id}}',
                        'email' => '{{trigger.customer.email}}',
                        'name' => '{{trigger.customer.name}}',
                    ],
                    'timestamp' => '{{trigger.timestamp}}',
                ],
                'timeout' => 30,
            ],
        ]);

    // Create trigger
    $trigger = \App\Models\Automation\Trigger::query()
        ->create([
            'sequence_id' => $sequence->id,
            'event_name' => 'order.created',
            'target_type' => 'offer',
            'target_id' => 3,
            'next_node_id' => $customerEmail->id,
        ]);

    // Create edges to connect the flow
    \App\Models\Automation\Edge::query()->create([
        'from_node_id' => $customerEmail->id,
        'to_node_id' => $internalEmail->id,
        'sequence_id' => $sequence->id,
    ]);

    \App\Models\Automation\Edge::query()->create([
        'from_node_id' => $internalEmail->id,
        'to_node_id' => $stripeFunction->id,
        'sequence_id' => $sequence->id,
    ]);

    \App\Models\Automation\Edge::query()->create([
        'from_node_id' => $stripeFunction->id,
        'to_node_id' => $webhook->id,
        'sequence_id' => $sequence->id,
    ]);

    return redirect('/automation')->with('success', 'Example automation sequence created! The flow includes: Order trigger → Customer email → Internal email → Stripe function → Webhook');

})->name('workflow-test');


// get offer controller
// redirect to
Route::middleware(['frame-embed'])->group(function () {
    Route::get('/o/{offer}/{environment?}', [CheckoutController::class, 'initialize'])
        ->name('offers.show')
        ->where('environment', 'live|test');

    Route::get('/checkout/{checkout}', [CheckoutController::class, 'show'])
        ->name('checkouts.show');
});

Route::post('/checkouts/{checkoutSession}/mutations', [CheckoutSessionController::class, 'storeMutation'])
    ->name('checkouts.mutations.store');

Route::middleware(['auth', 'verified'])->group(function () {
    // No access route
    Route::get('/no-access', [NoAccessController::class, '__invoke'])->name('no-access');

    // Organization setup route - no organization middleware
    Route::get('/organizations/setup', function () {
        return Inertia::render('organizations/setup');
    })->name('organizations.setup');

    // Organization routes
    Route::prefix('organizations')
        ->name('organizations.')
        ->group(function () {
            Route::post('/', [OrganizationController::class, 'store'])->name('store');
            Route::post('switch/{organization}', [OrganizationController::class, 'switch'])->name('switch');
            Route::put('/{organization}', [OrganizationController::class, 'update'])->name('update');

            // Organization settings routes
            Route::middleware(['organization', 'subscription'])
                ->group(function () {
                    Route::prefix('settings')->name('settings.')->group(function () {
                        Route::get('/', [OrganizationController::class, 'settings'])->name('general');
                        Route::get('/team', [OrganizationController::class, 'team'])->name('team');
                        Route::delete('/team/{user}', [OrganizationController::class, 'removeTeamMember'])->name('team.remove');

                        Route::prefix('billing')->name('billing.')->group(function () {
                            Route::get('/', [BillingCheckoutController::class, 'billing'])->name('index');
                            Route::get('/portal', [BillingCheckoutController::class, 'portal'])->name('portal');
                        });
                    });
                });


            Route::get('/themes', [ThemeController::class, 'index'])->name('themes.index');
            Route::post('/themes', [ThemeController::class, 'store'])->name('themes.store');
            Route::put('/themes/{theme}', [ThemeController::class, 'update'])->name('themes.update');
            Route::get('/themes/{theme}', [ThemeController::class, 'edit'])->name('themes.edit');
            Route::delete('/themes/{theme}', [ThemeController::class, 'destroy'])->name('themes.destroy');

        });

    // Routes that require an organization
    Route::middleware(['organization', 'subscription'])->group(function () {

        Route::resource('products', ProductsController::class);
        Route::resource('sequences', SequencesController::class);
        Route::post('products/{product}/prices/import', [PriceController::class, 'import'])->name('products.prices.import');
        Route::resource('products.prices', PriceController::class);

        Route::get('/integrations/{integrationType}/callback', [IntegrationsController::class, 'callback']);
        Route::post('/integrations/{integrationType}/authorizations', [IntegrationsController::class, 'authorize']);
        Route::get('/integrations/{integration}/products', [IntegrationsController::class, 'products'])->name('integrations.products');
        Route::get('/integrations/{integration}/products/{gatewayProductId}/prices', [IntegrationsController::class, 'prices'])->name('integrations.prices');
        Route::resource('integrations', IntegrationsController::class);

        // Offers routes
        Route::resource('offers', OffersController::class)->except(['show', 'create']);

        Route::prefix('offers/{offer}')->name('offers.')->group(function () {
            Route::get('pricing', [OffersController::class, 'pricing'])->name('pricing');

            Route::get('settings/theme', [OffersController::class, 'settingsTheme'])->name('settings.theme');

            Route::put('theme', [OffersController::class, 'updateTheme'])->name('update.theme');

            // Add offerItem routes
            Route::resource('items', OfferItemsController::class)->names('items');

            Route::get('integrate', [OffersController::class, 'integrate'])->name('integrate');
            Route::get('sharing', [OffersController::class, 'sharing'])->name('sharing');
            Route::get('settings', [OffersController::class, 'settings'])->name('settings');
            Route::get('settings/customization', [OffersController::class, 'settingsCustomization'])->name('settings.customization');
            Route::get('settings/notifications', [OffersController::class, 'settingsNotifications'])->name('settings.notifications');
            Route::get('settings/access', [OffersController::class, 'settingsAccess'])->name('settings.access');
            Route::post('publish', [OffersController::class, 'publish'])->name('publish');
        });

        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');
        Route::post('/templates', [TemplateController::class, 'store'])->name('templates.store');
        Route::put('/templates/{template}', [TemplateController::class, 'update'])->name('templates.update');
        Route::post('/templates/{template}/use', [TemplateController::class, 'useTemplate'])->name('templates.use');
        Route::post('/templates/request', [TemplateController::class, 'requestTemplate'])->name('templates.request');

        // Media Upload Route
        Route::post('media', [MediaController::class, 'store'])->name('media.store');

        // Profile Routes
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        Route::get('/orders', [OrdersController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order:uuid}', [OrdersController::class, 'show'])->name('orders.show');

        // Automation routes
Route::resource('automation/sequences', AutomationController::class)->names('automation.sequences');
Route::post('/automation/sequences/{sequence}/duplicate', [AutomationController::class, 'duplicate'])->name('automation.duplicate');
Route::post('/automation/sequences/{sequence}/test', [AutomationController::class, 'test'])->name('automation.test');
Route::get('/automation/sequences/{sequence}/workflow-runs', [AutomationController::class, 'getWorkflowRuns'])->name('automation.workflow-runs');
Route::post('/automation/sequences/{sequence}/nodes', [AutomationController::class, 'createDraftNode'])->name('automation.nodes.create');
Route::put('/automation/sequences/{sequence}/nodes/{node}', [AutomationController::class, 'updateDraftNode'])->name('automation.nodes.update');
Route::post('/automations/test-action', [AutomationController::class, 'testAction'])->name('automation.test-action');
Route::post('/automations/workflow-status', [AutomationController::class, 'workflowStatus'])->name('automation.workflow-status');

        // Template Editor Demo Route
        Route::get('/template-editor-demo', function () {
            return Inertia::render('TemplateEditorDemo');
        })->name('template-editor-demo');
    });
});

Route::middleware(['auth', 'organization'])->group(function () {
    Route::get('organizations/settings/billing/checkout', [BillingCheckoutController::class, 'checkout'])
        ->name('organizations.settings.billing.checkout');
});

// Media routes
Route::middleware(['auth'])->group(function () {
    Route::post('/medias/upload-url', [MediaController::class, 'generateUploadUrl'])->name('medias.upload-url');
    Route::put('/medias/{media}/upload', [MediaController::class, 'upload'])->name('medias.upload');
    Route::post('/medias/{media}/finalize', [MediaController::class, 'finalizeUpload'])->name('medias.finalize');
});

Route::get('m/{dir}/{media}.{extension}', function (string $dir, \App\Models\Media $media) {
    return redirect()->away($media->getSignedUrl(60));
});

Route::post('/feedback', [FeedbackController::class, 'submit'])->name('feedback.submit');

// JavaScript Execution routes
Route::get('/test', [JavaScriptExecutionController::class, 'test'])->name('js-execution.test');
Route::post('/js-execute', [JavaScriptExecutionController::class, 'execute'])->name('js-execution.execute');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

//
