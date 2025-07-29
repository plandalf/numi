<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Order\Order;
use App\Http\Resources\OrderResource;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $orders = Order::with(['customer', 'items.price.product', 'paymentMethod', 'organization'])
            ->when($request->search, function ($query, $search) {
                $query->where('uuid', 'like', '%' . $search . '%')
                    ->orWhere('customer_name', 'like', '%' . $search . '%')
                    ->orWhere('customer_email', 'like', '%' . $search . '%')
                    ->orWhere('customer_phone', 'like', '%' . $search . '%');
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Orders/Index', [
            'orders' => OrderResource::collection($orders),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Orders/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
            'total_amount' => 'required|integer',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'organization_id' => 'required|exists:organizations,id',
        ]);

        $order = Order::create([
            'uuid' => Order::generateUuid(),
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'total_amount' => $request->total_amount,
            'payment_method_id' => $request->payment_method_id,
            'organization_id' => $request->organization_id,
        ]);

        return redirect()->route('orders.show', $order->uuid);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $uuid)
    {
        $order = Order::where('uuid', $uuid)
            ->with(['customer', 'items.price.product', 'paymentMethod', 'organization'])
            ->firstOrFail();

        return Inertia::render('Orders/Show', [
            'order' => new OrderResource($order),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $uuid)
    {
        $order = Order::where('uuid', $uuid)
            ->with(['customer', 'items.price.product', 'paymentMethod', 'organization'])
            ->firstOrFail();

        return Inertia::render('Orders/Edit', [
            'order' => new OrderResource($order),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $uuid)
    {
        $order = Order::where('uuid', $uuid)
            ->with(['customer', 'items.price.product', 'paymentMethod', 'organization'])
            ->firstOrFail();

        $request->validate([
            'customer_name' => 'required|string',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
            'total_amount' => 'required|integer',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'organization_id' => 'required|exists:organizations,id',
        ]);

        $order->update([
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'total_amount' => $request->total_amount,
            'payment_method_id' => $request->payment_method_id,
            'organization_id' => $request->organization_id,
        ]);

        return redirect()->route('orders.show', $order->uuid);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $uuid)
    {
        $order = Order::where('uuid', $uuid)
            ->with(['customer', 'items.price.product', 'paymentMethod', 'organization'])
            ->firstOrFail();

        $order->delete();

        return redirect()->route('orders.index');
    }

    /**
     * Generate a PDF receipt for the order.
     */
    public function receipt(string $uuid): \Illuminate\Http\Response
    {
        $order = Order::where('uuid', $uuid)
            ->with(['customer', 'items.price.product', 'paymentMethod', 'organization'])
            ->firstOrFail();

        $data = [
            'order' => $order,
            'organization' => $order->organization,
            'customer' => $order->customer,
            'items' => $order->items,
            'payment_method' => $order->paymentMethod,
            'formatted_date' => $order->created_at->format('M j, Y'),
            'formatted_time' => $order->created_at->format('g:i A'),
            'total_formatted' => '$' . number_format($order->total_amount / 100, 2),
        ];

        $pdf = Pdf::loadView('receipts.order', $data);
        
        return $pdf->stream("receipt-{$order->uuid}.pdf");
    }
} 