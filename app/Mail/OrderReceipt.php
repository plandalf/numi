<?php

namespace App\Mail;

use App\Models\Order\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;

class OrderReceipt extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public bool $isTest = false,
    ) {}

    /**
     *
     * 
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subjectPrefix = $this->isTest ? 'TEST: ' : '';
        $fromName = $this->order->organization?->name ?: 'Plandalf Receipts';
        $subdomain = $this->order->organization?->subdomain;
        $tag = $subdomain ? strtolower(preg_replace('/[^a-z0-9]+/i', '', (string) $subdomain)) : '';
        $localPart = 'receipts' . ($tag ? '+'.$tag : '');
        $fromAddress = new Address($localPart.'@plandalf-mail.com', $fromName);

        return new Envelope(
            subject: $subjectPrefix.'Your receipt for Order #'.$this->order->order_number,
            from: $fromAddress,
            tags: [
                $this->isTest ? 'order-receipt-test' : 'order-receipt'
            ],
            metadata: [
                'order_id' => $this->order->id,
                'organization_id' => $this->order->organization_id,
                'is_test' => $this->isTest,
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $order = $this->order
            ->loadMissing([
                'items.price.product',
                'customer',
                'organization',
                'paymentMethod',
                'checkoutSession',
            ]);

        $currencyCode = $this->resolveCurrencyCode($order);

        $lineItems = [];
        $subtotalCents = 0;

        foreach ($order->items as $item) {
            $unitAmountCents = (int) $item->price->amount->getAmount();
            $lineTotalCents = (int) $item->price->calculateAmount($item->quantity)->getAmount();
            $subtotalCents += $lineTotalCents;

            $lineItems[] = [
                'name' => $item->price->product?->name ?? ($item->offerItem?->name ?? 'Item #'.$item->id),
                'quantity' => (int) $item->quantity,
                'unit_price_formatted' => $this->formatMoney($unitAmountCents, $currencyCode),
                'line_total_formatted' => $this->formatMoney($lineTotalCents, $currencyCode),
            ];
        }

        [$discounts, $discountTotalCents] = $this->resolveDiscounts($order, $subtotalCents, $currencyCode);
        $totalCents = max(0, $subtotalCents - $discountTotalCents);

        $paymentMethod = $order->paymentMethod;
        $paymentDisplay = $paymentMethod?->display_name ?? null;

        return new Content(
            markdown: 'mail.order-receipt',
            with: [
                'order' => $order,
                'organization' => $order->organization,
                'customer' => $order->customer,
                'items' => $lineItems,
                'subtotal' => $this->formatMoney($subtotalCents, $currencyCode),
                'discounts' => $discounts,
                'total' => $this->formatMoney($totalCents, $currencyCode),
                'currency' => strtoupper($currencyCode),
                'paymentDisplay' => $paymentDisplay,
                'receiptUrl' => $order->getReceiptUrl(),
                // Use only the signed receipt URL for now; public route may not exist in all installs
                'publicUrl' => null,
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

    private function resolveCurrencyCode(Order $order): string
    {
        if (!empty($order->currency)) {
            return strtolower($order->currency);
        }

        $firstItem = $order->items->first();
        if ($firstItem && $firstItem->price && $firstItem->price->currency) {
            return strtolower($firstItem->price->currency->getCode());
        }

        return 'usd';
    }

    private function formatMoney(int $amountInCents, string $currency): string
    {
        $amount = $amountInCents / 100;
        return match (strtolower($currency)) {
            'usd' => '$'.number_format($amount, 2),
            'cad' => 'C$'.number_format($amount, 2),
            'aud' => 'A$'.number_format($amount, 2),
            'nzd' => 'NZ$'.number_format($amount, 2),
            'gbp' => '£'.number_format($amount, 2),
            'eur' => '€'.number_format($amount, 2),
            'chf' => 'CHF '.number_format($amount, 2),
            'czk' => number_format($amount, 0).' CZK',
            'dkk' => number_format($amount, 0).' DKK',
            'nok' => number_format($amount, 0).' NOK',
            'pln' => number_format($amount, 0).' PLN',
            'ron' => number_format($amount, 0).' RON',
            'sek' => number_format($amount, 0).' SEK',
            default => number_format($amount, 2).' '.strtoupper($currency),
        };
    }

    /**
     * @return array{0: array<int, array{name:string, amount:string}>, 1: int}
     */
    private function resolveDiscounts(Order $order, int $subtotalCents, string $currency): array
    {
        $discountsDisplay = [];
        $discountTotalCents = 0;

        $discounts = $order->checkoutSession->discounts ?? [];
        if (empty($discounts)) {
            return [$discountsDisplay, 0];
        }

        foreach ($discounts as $discount) {
            $name = $discount['name'] ?? 'Discount';
            if (isset($discount['percent_off'])) {
                $amountCents = (int) round($subtotalCents * ((float) $discount['percent_off'] / 100));
                $discountTotalCents += $amountCents;
                $discountsDisplay[] = [
                    'name' => $name.' ('.((float) $discount['percent_off']).'%)',
                    'amount' => '-'.$this->formatMoney($amountCents, $currency),
                ];
            } elseif (isset($discount['amount_off'])) {
                $amountCents = (int) $discount['amount_off'];
                $discountTotalCents += $amountCents;
                $discountsDisplay[] = [
                    'name' => $name,
                    'amount' => '-'.$this->formatMoney($amountCents, $currency),
                ];
            }
        }

        return [$discountsDisplay, $discountTotalCents];
    }
}
