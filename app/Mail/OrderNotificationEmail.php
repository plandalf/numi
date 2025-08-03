<?php

namespace App\Mail;

use App\Models\Order\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderNotificationEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Order $order,
        public bool $isTest = false
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isTest
            ? "TEST: New Order #{$this->order->order_number} - Fulfillment Required"
            : "New Order #{$this->order->order_number} - Fulfillment Required";

        return new Envelope(
            subject: $subject,
            tags: $this->isTest ? ['order', 'fulfillment', 'test'] : ['order', 'fulfillment'],
            metadata: [
                'order_id' => $this->order->id,
                'organization_id' => $this->order->organization_id,
                'fulfillment_method' => $this->order->fulfillment_method?->value,
                'is_test' => $this->isTest,
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.order-notification',
            with: [
                'order' => $this->order,
                'organization' => $this->order->organization,
                'items' => $this->order->items,
                'customer' => $this->order->customer,
                'dashboardUrl' => route('orders.show', $this->order),
                'isTest' => $this->isTest,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
