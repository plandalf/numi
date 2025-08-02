<?php

namespace App\Http\Controllers;

use App\Enums\OnboardingInfo;
use App\Http\Resources\OrderResource;
use App\Models\Order\Order;
use App\Models\OrderItemFulfillmentStep;
use App\Services\OrderEventService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Order\OrderItem;
use App\Enums\DeliveryMethod;
use Illuminate\Support\Facades\Gate;

class OrdersController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $organizationId = Auth::user()->currentOrganization->id;
        $search = request('search', '');

        $orders = Order::query()
            ->where('organization_id', $organizationId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('uuid', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($q) use ($search) {
                            $q->where('email', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->with(['items.price.product', 'customer', 'checkoutSession'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Orders/Index', [
            'orders' => [
                'data' => OrderResource::collection($orders)->toArray(request()),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'links' => $orders->linkCollection()->toArray(),
            ],
            'filters' => [
                'search' => $search,
            ],
            'showOrdersTutorial' => !Auth::user()->hasSeenOnboardingInfo(OnboardingInfo::ORDERS_TUTORIAL),
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order): Response
    {
        Gate::authorize('view', $order);

        $order->load([
            'items.price.product',
            'customer',
            'checkoutSession',
            'events.user',
            'organization'
        ]);

        return Inertia::render('Orders/Show', [
            'order' => new OrderResource($order),
        ]);
    }

    /**
     * Show the fulfillment page for an order.
     */
    public function fulfillment(Order $order)
    {
        Gate::authorize('fulfillment', $order);

        $order->load([
            'items.price.product',
            'items.fulfilledBy',
            'customer',
            'events.user',
            'organization'
        ]);

        return Inertia::render('Orders/Fulfillment', [
            'order' => new OrderResource($order),
        ]);
    }

    /**
     * Update fulfillment status of an order item.
     */
    public function updateFulfillment(Request $request, Order $order, OrderItem $orderItem)
    {
        Gate::authorize('update', $order);

        $validated = $request->validate([
            'fulfillment_status' => 'required|in:pending,partially_fulfilled,fulfilled,unprovisionable',
            'quantity_fulfilled' => 'required|integer|min:0|max:' . $orderItem->quantity,
            'notes' => 'nullable|string|max:1000',
            'metadata' => 'nullable|array',
            'tracking_number' => 'nullable|string|max:255',
            'tracking_url' => 'nullable|url|max:500',
            'unprovisionable_reason' => 'nullable|string|max:1000',
            'delivery_assets' => 'nullable|array',
            'delivery_assets.*.name' => 'required|string|max:255',
            'delivery_assets.*.url' => 'required|url|max:500',
        ]);

        // Update fulfillment data
        $orderItem->fulfillment_status = $validated['fulfillment_status'];
        $orderItem->quantity_fulfilled = $validated['quantity_fulfilled'];
        $orderItem->quantity_remaining = $orderItem->quantity - $validated['quantity_fulfilled'];
        
        if ($validated['notes']) {
            $orderItem->fulfillment_notes = $validated['notes'];
        }
        
        if ($validated['metadata']) {
            $orderItem->fulfillment_data = array_merge($orderItem->fulfillment_data ?? [], $validated['metadata']);
        }
        
        if ($validated['tracking_number']) {
            $orderItem->tracking_number = $validated['tracking_number'];
        }
        
        if ($validated['tracking_url']) {
            $orderItem->tracking_url = $validated['tracking_url'];
        }
        
        if ($validated['unprovisionable_reason']) {
            $orderItem->unprovisionable_reason = $validated['unprovisionable_reason'];
        }
        
        if ($validated['delivery_assets']) {
            $orderItem->delivery_assets = $validated['delivery_assets'];
        }

        // Set fulfillment timestamp and user
        if ($validated['fulfillment_status'] === 'fulfilled' || $validated['fulfillment_status'] === 'partially_fulfilled') {
            $orderItem->fulfilled_at = now();
            $orderItem->fulfilled_by_user_id = auth()->id();
        }

        $orderItem->save();

        // Update overall order fulfillment status
        $orderItem->order->updateFulfillmentStatus();

        // Log event
        $eventService = new OrderEventService();
        $eventService->createEvent(
            $order,
            'item_fulfillment_updated',
            "Updated fulfillment for {$orderItem->price->product->name}: {$validated['fulfillment_status']} ({$validated['quantity_fulfilled']}/{$orderItem->quantity})",
            [
                'order_item_id' => $orderItem->id,
                'fulfillment_status' => $validated['fulfillment_status'],
                'quantity_fulfilled' => $validated['quantity_fulfilled'],
                'notes' => $validated['notes'] ?? null,
                'metadata' => $validated['metadata'] ?? null,
            ]
        );

        return redirect()->back()->with('success', 'Order item fulfillment updated successfully.');
    }

    /**
     * Mark an order item as unprovisionable.
     */
    public function markUnprovisionable(Request $request, Order $order, OrderItem $orderItem)
    {
        Gate::authorize('update', $order);

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $orderItem->markAsUnprovisionable($validated['reason']);

        // Log event
        $eventService = new OrderEventService();
        $eventService->createEvent(
            $order,
            'item_unprovisionable',
            "Marked {$orderItem->price->product->name} as unprovisionable",
            [
                'order_item_id' => $orderItem->id,
                'reason' => $validated['reason'],
            ]
        );

        return redirect()->back()->with('success', 'Order item marked as unprovisionable.');
    }
}
