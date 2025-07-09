<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderStatusController extends Controller
{
    public function show(Order $order): Response
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
} 