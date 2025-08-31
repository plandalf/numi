<?php

namespace App\Apps\Plandalf\Actions;

use App\Mail\OrderReceipt;
use App\Models\Order\Order;
use App\Workflows\Attributes\IsAction;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;

#[IsAction(
    key: 'send_receipt',
    noun: 'Receipt',
    label: 'Send Order Receipt',
    description: 'Send a receipt email to the order\'s customer using the OrderReceipt template.',
    type: 'action'
)]
class SendReceiptAction extends AppAction
{
    public static function props(): array
    {
        return [
            Field::string('order_uuid', 'Order UUID')
                ->required()
                ->help('The UUID of the order to send the receipt for.'),

            Field::email('to', 'Recipient Email')
                ->optional()
                ->help('If not provided, the order\'s customer email will be used.'),

            Field::boolean('test', 'Send as Test')
                ->optional()
                ->default(true)
                ->help('If enabled, marks the email subject as TEST and avoids side-effects.'),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        $orderUuid = Arr::get($bundle->input, 'order_uuid');
        $to = Arr::get($bundle->input, 'to');
        $isTest = (bool) (Arr::get($bundle->input, 'test', true));

        if (empty($orderUuid)) {
            throw new \InvalidArgumentException('order_uuid is required');
        }

        /** @var Order|null $order */
        $order = Order::query()
            ->where('uuid', $orderUuid)
            ->with(['items.price.product', 'customer', 'organization', 'paymentMethod', 'checkoutSession'])
            ->first();

        if (! $order) {
            throw new \InvalidArgumentException('Order not found for UUID: '.$orderUuid);
        }

        $recipient = $to ?: $order->customer?->email;
        if (empty($recipient)) {
            throw new \InvalidArgumentException('Recipient email is required (missing both input and order customer email).');
        }

        $mailable = new OrderReceipt(order: $order, isTest: $isTest);

        Mail::to($recipient)->send($mailable);

        return [
            'success' => true,
            'order_id' => $order->id,
            'order_uuid' => $order->uuid,
            'order_number' => $order->order_number,
            'to' => $recipient,
            'test' => $isTest,
            'sent_at' => now()->toISOString(),
        ];
    }
}


