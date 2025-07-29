<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class OrderStatusController
{
    public function __invoke(Request $request, Order $order)
    {
        // Load all necessary relationships for the order status page
        $order->load([
            'items.price.product',
            'items.fulfilledBy',
            'customer',
            'checkoutSession',
            'events.user',
            'organization'
        ]);

        return Inertia::render('OrderStatus', [
            'order' => new OrderResource($order),
        ]);
    }

    public function generatePublicUrl(Request $request, Order $order)
    {
        // Generate a signed URL for the order status page
        $signedUrl = URL::signedRoute('order-status.show', ['order' => $order->uuid], now()->addDays(30));
        
        // Redirect to the signed URL
        return redirect()->away($signedUrl);
    }
}
