<?php

namespace App\Http\Controllers;


use App\Models\Order\Order;
use Inertia\Inertia;

class OderController extends Controller
{
    public function index()
    {
        /*** Filter the orders by the current customer/user */
        return Inertia::render('orders/index', [
            'orders' => Order::all(),
        ]);
    }

    public function show(Order $order)
    {
        return Inertia::render('orders/show', [
            'order' => $order,
        ]);
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->route('orders.index');
    }
}
