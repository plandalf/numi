<?php

namespace App\Services;

use App\Models\Order\Order;
use App\Models\OrderEvent;
use App\Models\User;

class OrderEventService
{
    /**
     * Create a new order event.
     */
    public function createEvent(Order $order, string $type, string $description, array $metadata = [], User $user = null): OrderEvent
    {
        return OrderEvent::createEvent($order, $type, $description, $metadata, $user);
    }

    /**
     * Log order created event.
     */
    public function logOrderCreated(Order $order, User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'order_created',
            'Order was created',
            ['order_id' => $order->id],
            $user
        );
    }

    /**
     * Log order completed event.
     */
    public function logOrderCompleted(Order $order, User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'order_completed',
            'Order was completed',
            ['order_id' => $order->id],
            $user
        );
    }

    /**
     * Log order cancelled event.
     */
    public function logOrderCancelled(Order $order, User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'order_cancelled',
            'Order was cancelled',
            ['order_id' => $order->id],
            $user
        );
    }

    /**
     * Log order fulfillment started event.
     */
    public function logFulfillmentStarted(Order $order, User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'fulfillment_started',
            'Order fulfillment started',
            ['order_id' => $order->id],
            $user
        );
    }

    /**
     * Log order fulfillment completed event.
     */
    public function logFulfillmentCompleted(Order $order, User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'fulfillment_completed',
            'Order fulfillment completed',
            ['order_id' => $order->id],
            $user
        );
    }

    /**
     * Log order shipped event.
     */
    public function logOrderShipped(Order $order, array $trackingData = [], User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'order_shipped',
            'Order was shipped',
            array_merge(['order_id' => $order->id], $trackingData),
            $user
        );
    }

    /**
     * Log order delivered event.
     */
    public function logOrderDelivered(Order $order, User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'order_delivered',
            'Order was delivered',
            ['order_id' => $order->id],
            $user
        );
    }

    /**
     * Log manual fulfillment event.
     */
    public function logManualFulfillment(Order $order, string $notes = '', User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'manual_fulfillment',
            'Order was manually fulfilled',
            [
                'order_id' => $order->id,
                'notes' => $notes,
                'fulfillment_method' => 'manual'
            ],
            $user
        );
    }

    /**
     * Log order note added event.
     */
    public function logNoteAdded(Order $order, string $note, User $user = null): OrderEvent
    {
        return $this->createEvent(
            $order,
            'note_added',
            'Note added to order',
            [
                'order_id' => $order->id,
                'note' => $note
            ],
            $user
        );
    }

    /**
     * Get all events for an order.
     */
    public function getOrderEvents(Order $order): \Illuminate\Database\Eloquent\Collection
    {
        return $order->events()->with('user')->get();
    }

    /**
     * Get recent events for an order.
     */
    public function getRecentOrderEvents(Order $order, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return $order->events()->with('user')->limit($limit)->get();
    }
} 