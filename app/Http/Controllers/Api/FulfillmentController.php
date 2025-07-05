<?php

namespace App\Http\Controllers\Api;

use App\Actions\Fulfillment\MarkUnprovisionableAction;
use App\Actions\Fulfillment\ProvisionOrderItemAction;
use App\Actions\Fulfillment\SendOrderNotificationAction;
use App\Actions\Fulfillment\UpdateTrackingAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderItemResource;
use App\Http\Resources\OrderResource;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * @group Fulfillment Management
 * 
 * APIs for managing order fulfillment status, tracking information, and delivery assets.
 * All endpoints require API key authentication.
 */
class FulfillmentController extends Controller
{
    public function __construct(
        private ProvisionOrderItemAction $provisionOrderItemAction,
        private MarkUnprovisionableAction $markUnprovisionableAction,
        private UpdateTrackingAction $updateTrackingAction,
        private SendOrderNotificationAction $sendOrderNotificationAction
    ) {}

    /**
     * Get fulfillment overview for organization.
     * 
     * @group Fulfillment Overview
     * 
     * @queryParam status string Filter orders by fulfillment status. Example: pending
     * @queryParam fulfillment_method string Filter by fulfillment method. Example: manual
     * @queryParam page integer Page number for pagination. Example: 1
     * 
     * @response 200 {
     *   "data": [
     *     {
     *       "id": 123,
     *       "uuid": "order-uuid-123",
     *       "status": {
     *         "value": "completed",
     *         "label": "Completed"
     *       },
     *       "fulfillment_summary": {
     *         "total_items": 3,
     *         "fulfilled_items": 2,
     *         "pending_items": 1,
     *         "unprovisionable_items": 0
     *       },
     *       "customer": {
     *         "id": 456,
     *         "name": "John Doe",
     *         "email": "john@example.com"
     *       },
     *       "created_at": "2024-01-15T10:30:00Z"
     *     }
     *   ],
     *   "meta": {
     *     "total": 50,
     *     "per_page": 20,
     *     "current_page": 1,
     *     "last_page": 3
     *   }
     * }
     * 
     * @response 401 {
     *   "error": "Unauthorized",
     *   "message": "Invalid API key"
     * }
     */
    public function index(Request $request): JsonResponse
    {
        $organization = $request->user()->currentOrganization;
        
        $orders = Order::where('organization_id', $organization->id)
            ->with(['items.fulfilledBy', 'items.price', 'items.offerItem', 'customer'])
            ->when($request->status, function ($query, $status) {
                $query->whereHas('items', function ($q) use ($status) {
                    $q->where('fulfillment_status', $status);
                });
            })
            ->when($request->fulfillment_method, function ($query, $method) {
                $query->where('fulfillment_method', $method);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => OrderResource::collection($orders),
            'meta' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    /**
     * Get fulfillment details for a specific order.
     * 
     * @group Order Details
     * 
     * @urlParam order string required The order UUID. Example: order-uuid-123
     * 
     * @response 200 {
     *   "data": {
     *     "id": 123,
     *     "uuid": "order-uuid-123",
     *     "status": {
     *       "value": "completed",
     *       "label": "Completed"
     *     },
     *     "fulfillment_summary": {
     *       "total_items": 3,
     *       "fulfilled_items": 2,
     *       "pending_items": 1,
     *       "unprovisionable_items": 0
     *     },
     *     "customer": {
     *       "id": 456,
     *       "name": "John Doe",
     *       "email": "john@example.com"
     *     },
     *     "items": [
     *       {
     *         "id": 789,
     *         "fulfillment_status": "fulfilled",
     *         "quantity_fulfilled": 2,
     *         "quantity_remaining": 0,
     *         "tracking_number": "1234567890",
     *         "tracking_url": "https://fedex.com/track?trknbr=1234567890",
     *         "delivery_assets": [
     *           {
     *             "name": "Digital Download",
     *             "url": "https://example.com/download/file.pdf"
     *           }
     *         ],
     *         "fulfillment_notes": "Shipped via express delivery",
     *         "price": {
     *           "product": {
     *             "name": "Premium Course"
     *           }
     *         }
     *       }
     *     ]
     *   }
     * }
     * 
     * @response 403 {
     *   "error": "Unauthorized",
     *   "message": "You are not authorized to view this order"
     * }
     * 
     * @response 404 {
     *   "error": "Not Found",
     *   "message": "Order not found"
     * }
     */
    public function show(Order $order): JsonResponse
    {
        Gate::authorize('view', $order);
        
        $order->load(['items.fulfilledBy', 'items.price', 'items.offerItem', 'customer', 'organization']);
        
        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Update order item fulfillment status and details.
     * 
     * @group Order Item Management
     * 
     * @urlParam orderItem integer required The order item ID. Example: 789
     * 
     * @bodyParam fulfillment_status string required The fulfillment status. Must be one of: pending, partially_fulfilled, fulfilled, unprovisionable. Example: partially_fulfilled
     * @bodyParam quantity_fulfilled integer required Number of items fulfilled. Must be between 0 and the total order item quantity. Example: 2
     * @bodyParam notes string optional Fulfillment notes. Max 1000 characters. Example: Shipped via express delivery
     * @bodyParam metadata object optional Custom metadata key-value pairs. Example: {"carrier": "FedEx", "service_level": "express"}
     * @bodyParam tracking_number string optional Shipping tracking number. Max 255 characters. Example: 1234567890
     * @bodyParam tracking_url string optional Tracking URL. Must be a valid URL. Max 500 characters. Example: https://fedex.com/track?trknbr=1234567890
     * @bodyParam unprovisionable_reason string optional Reason if status is unprovisionable. Max 1000 characters. Example: Product discontinued
     * @bodyParam delivery_assets array optional Array of delivery assets. Example: [{"name": "Digital Download", "url": "https://example.com/download/file.pdf"}]
     * @bodyParam delivery_assets.*.name string required Asset name. Required if delivery_assets provided. Max 255 characters. Example: Digital Download
     * @bodyParam delivery_assets.*.url string required Asset URL. Required if delivery_assets provided. Must be a valid URL. Max 500 characters. Example: https://example.com/download/file.pdf
     * 
     * @response 200 {
     *   "data": {
     *     "id": 789,
     *     "fulfillment_status": "partially_fulfilled",
     *     "quantity_fulfilled": 2,
     *     "quantity_remaining": 1,
     *     "notes": "Shipped via express delivery",
     *     "tracking_number": "1234567890",
     *     "tracking_url": "https://fedex.com/track?trknbr=1234567890",
     *     "delivery_assets": [
     *       {
     *         "name": "Digital Download",
     *         "url": "https://example.com/download/file.pdf"
     *       }
     *     ],
     *     "fulfilled_at": "2024-01-15T14:30:00Z",
     *     "fulfilled_by": {
     *       "id": 1,
     *       "name": "Admin User",
     *       "email": "admin@example.com"
     *     }
     *   },
     *   "message": "Order item fulfillment updated successfully"
     * }
     * 
     * @response 422 {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "fulfillment_status": ["The fulfillment status field is required."],
     *     "quantity_fulfilled": ["The quantity fulfilled must be at least 0."]
     *   }
     * }
     * 
     * @response 403 {
     *   "error": "Unauthorized",
     *   "message": "You are not authorized to update this order"
     * }
     * 
     * @response 500 {
     *   "error": "Failed to update order item fulfillment",
     *   "message": "An error occurred while processing the request"
     * }
     */
    public function provisionItem(OrderItem $orderItem, Request $request): JsonResponse
    {
        Gate::authorize('update', $orderItem->order);
        
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

        try {
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
            $eventService = new \App\Services\OrderEventService();
            $eventService->createEvent(
                $orderItem->order,
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
            
            return response()->json([
                'data' => new OrderItemResource($orderItem),
                'message' => 'Order item fulfillment updated successfully',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to update order item fulfillment', [
                'order_item_id' => $orderItem->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to update order item fulfillment',
                'message' => 'An error occurred while processing the request',
            ], 500);
        }
    }

    /**
     * Mark an order item as unprovisionable.
     * 
     * @group Order Item Management
     * 
     * @urlParam orderItem integer required The order item ID. Example: 789
     * 
     * @bodyParam unprovisionable_reason string required Reason why item cannot be fulfilled. Max 1000 characters. Example: Product discontinued by manufacturer
     * @bodyParam notes string optional Additional notes. Max 1000 characters. Example: Customer will be contacted for alternative options
     * 
     * @response 200 {
     *   "data": {
     *     "id": 789,
     *     "fulfillment_status": "unprovisionable",
     *     "unprovisionable_reason": "Product discontinued by manufacturer",
     *     "notes": "Customer will be contacted for alternative options",
     *     "fulfilled_at": "2024-01-15T14:30:00Z",
     *     "fulfilled_by": {
     *       "id": 1,
     *       "name": "Admin User",
     *       "email": "admin@example.com"
     *     }
     *   },
     *   "message": "Order item marked as unprovisionable"
     * }
     * 
     * @response 422 {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "unprovisionable_reason": ["The unprovisionable reason field is required."]
     *   }
     * }
     * 
     * @response 403 {
     *   "error": "Unauthorized",
     *   "message": "You are not authorized to update this order"
     * }
     * 
     * @response 500 {
     *   "error": "Failed to mark order item as unprovisionable",
     *   "message": "An error occurred while processing the request"
     * }
     */
    public function markUnprovisionable(OrderItem $orderItem, Request $request): JsonResponse
    {
        Gate::authorize('update', $orderItem->order);
        
        $validated = $request->validate([
            'unprovisionable_reason' => 'required|string|max:1000',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $orderItem->markAsUnprovisionable($validated['unprovisionable_reason']);
            
            if ($validated['notes']) {
                $orderItem->fulfillment_notes = $validated['notes'];
                $orderItem->save();
            }

            // Log event
            $eventService = new \App\Services\OrderEventService();
            $eventService->createEvent(
                $orderItem->order,
                'item_unprovisionable',
                "Marked {$orderItem->price->product->name} as unprovisionable",
                [
                    'order_item_id' => $orderItem->id,
                    'reason' => $validated['unprovisionable_reason'],
                    'notes' => $validated['notes'] ?? null,
                ]
            );
            
            return response()->json([
                'data' => new OrderItemResource($orderItem),
                'message' => 'Order item marked as unprovisionable',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to mark order item as unprovisionable', [
                'order_item_id' => $orderItem->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to mark order item as unprovisionable',
                'message' => 'An error occurred while processing the request',
            ], 500);
        }
    }

    /**
     * Update tracking information for an order item.
     * 
     * @group Order Item Management
     * 
     * @urlParam orderItem integer required The order item ID. Example: 789
     * 
     * @bodyParam tracking_number string optional Shipping tracking number. Max 255 characters. Example: 1234567890
     * @bodyParam tracking_url string optional Tracking URL. Must be a valid URL. Max 500 characters. Example: https://fedex.com/track?trknbr=1234567890
     * @bodyParam expected_delivery_date string optional Expected delivery date. Must be a valid date. Example: 2024-01-20
     * @bodyParam delivered_at string optional Actual delivery date. Must be a valid date. Example: 2024-01-18
     * @bodyParam notes string optional Additional notes. Max 1000 characters. Example: Package delivered to front door
     * 
     * @response 200 {
     *   "data": {
     *     "id": 789,
     *     "tracking_number": "1234567890",
     *     "tracking_url": "https://fedex.com/track?trknbr=1234567890",
     *     "expected_delivery_date": "2024-01-20",
     *     "delivered_at": "2024-01-18",
     *     "notes": "Package delivered to front door"
     *   },
     *   "message": "Tracking information updated successfully"
     * }
     * 
     * @response 422 {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "tracking_url": ["The tracking url must be a valid URL."]
     *   }
     * }
     * 
     * @response 403 {
     *   "error": "Unauthorized",
     *   "message": "You are not authorized to update this order"
     * }
     * 
     * @response 500 {
     *   "error": "Failed to update tracking information",
     *   "message": "An error occurred while processing the request"
     * }
     */
    public function updateTracking(OrderItem $orderItem, Request $request): JsonResponse
    {
        Gate::authorize('update', $orderItem->order);
        
        $validated = $request->validate([
            'tracking_number' => 'sometimes|string|max:255',
            'tracking_url' => 'sometimes|url|max:500',
            'expected_delivery_date' => 'sometimes|date',
            'delivered_at' => 'sometimes|date',
            'notes' => 'sometimes|string|max:1000',
        ]);

        try {
            $updatedOrderItem = $this->updateTrackingAction->execute($orderItem, $validated);
            
            return response()->json([
                'data' => new OrderItemResource($updatedOrderItem),
                'message' => 'Tracking information updated successfully',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to update tracking information', [
                'order_item_id' => $orderItem->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to update tracking information',
                'message' => 'An error occurred while processing the request',
            ], 500);
        }
    }

    /**
     * Resend order notification email.
     * 
     * @group Notifications
     * 
     * @urlParam order string required The order UUID. Example: order-uuid-123
     * 
     * @response 200 {
     *   "message": "Order notification sent successfully"
     * }
     * 
     * @response 403 {
     *   "error": "Unauthorized",
     *   "message": "You are not authorized to update this order"
     * }
     * 
     * @response 500 {
     *   "error": "Failed to send order notification",
     *   "message": "An error occurred while sending the notification"
     * }
     */
    public function resendNotification(Order $order): JsonResponse
    {
        Gate::authorize('update', $order);
        
        try {
            // Reset notification status
            $order->fulfillment_notified = false;
            $order->fulfillment_notified_at = null;
            $order->save();
            
            // Send notification
            $this->sendOrderNotificationAction->execute($order);
            
            return response()->json([
                'message' => 'Order notification sent successfully',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send order notification', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to send order notification',
                'message' => 'An error occurred while sending the notification',
            ], 500);
        }
    }

    /**
     * Get fulfillment statistics for organization.
     * 
     * @group Statistics
     * 
     * @response 200 {
     *   "data": {
     *     "total_orders": 150,
     *     "pending_fulfillment": 25,
     *     "fulfilled_items": 300,
     *     "unprovisionable_items": 5
     *   }
     * }
     * 
     * @response 401 {
     *   "error": "Unauthorized",
     *   "message": "Invalid API key"
     * }
     */
    public function statistics(Request $request): JsonResponse
    {
        $organization = $request->user()->currentOrganization;
        
        $stats = [
            'total_orders' => Order::where('organization_id', $organization->id)->count(),
            'pending_fulfillment' => OrderItem::whereHas('order', function ($query) use ($organization) {
                $query->where('organization_id', $organization->id);
            })->where('fulfillment_status', 'pending')->count(),
            'fulfilled_items' => OrderItem::whereHas('order', function ($query) use ($organization) {
                $query->where('organization_id', $organization->id);
            })->where('fulfillment_status', 'fulfilled')->count(),
            'unprovisionable_items' => OrderItem::whereHas('order', function ($query) use ($organization) {
                $query->where('organization_id', $organization->id);
            })->where('fulfillment_status', 'unprovisionable')->count(),
        ];
        
        return response()->json([
            'data' => $stats,
        ]);
    }
} 