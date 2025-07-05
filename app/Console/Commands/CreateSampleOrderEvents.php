<?php

namespace App\Console\Commands;

use App\Models\Order\Order;
use App\Services\OrderEventService;
use Illuminate\Console\Command;

class CreateSampleOrderEvents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:create-sample-events';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create sample order events for existing orders';

    /**
     * Execute the console command.
     */
    public function handle(OrderEventService $orderEventService)
    {
        $this->info('Creating sample order events...');

        $orders = Order::with('items')->take(5)->get();

        foreach ($orders as $order) {
            // Create order created event
            $orderEventService->logOrderCreated($order);

            // If order is completed, add completion event
            if ($order->status->value === 'completed') {
                $orderEventService->logOrderCompleted($order);
                $orderEventService->logFulfillmentStarted($order);
                
                // Add some manual fulfillment events for completed orders
                if ($order->items->count() > 0) {
                    $orderEventService->logManualFulfillment(
                        $order, 
                        'Items manually processed and prepared for delivery'
                    );
                    
                    if (rand(0, 1)) {
                        $orderEventService->logOrderShipped($order, [
                            'tracking_number' => 'TRACK' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT),
                            'carrier' => 'UPS'
                        ]);
                    }
                    
                    $orderEventService->logFulfillmentCompleted($order);
                }
            }

            // Add a note for some orders
            if (rand(0, 1)) {
                $orderEventService->logNoteAdded(
                    $order,
                    'Customer requested expedited processing - priority order'
                );
            }

            $this->line("Created events for order {$order->uuid}");
        }

        $this->info('Sample order events created successfully!');
    }
}
