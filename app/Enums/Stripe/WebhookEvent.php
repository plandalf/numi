<?php

namespace App\Enums\Stripe;

enum WebhookEvent
{
    const INVOICE_PAYMENT_FAILED = 'invoice.payment_failed';
}
