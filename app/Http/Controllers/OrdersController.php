<?php

namespace App\Http\Controllers;

use App\Enums\OnboardingInfo;
use App\Http\Resources\OrderResource;
use App\Models\Order\Order;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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
        $this->authorizeOrganizationAccess($order);

        $order->load([
            'items.price.product',
            'customer',
            'checkoutSession',
        ]);

        return Inertia::render('Orders/Show', [
            'order' => new OrderResource($order),
        ]);
    }

    private function authorizeOrganizationAccess(Order $order): void
    {
        if ($order->organization_id !== Auth::user()->currentOrganization->id) {
            abort(403);
        }
    }
}
