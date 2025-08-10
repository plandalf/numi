<?php

declare(strict_types=1);

return [
    // Default config keys like 'only' or 'except' can be added if needed
    // 'only' => [],
    // 'except' => [],

    'groups' => [
        'portal' => [
            // Embedded offer/checkout
            'offers.show',
            'checkouts.*',
            'checkout.redirect.callback',
            'checkouts.mutations.store',

            // Order status (signed)
            'order-status.*',

            // Client billing portal + cancellation flow
            'client.*',

            // Media and misc used by embeds/receipts
            'media.show',
            'orders.receipt',
            'feedback.submit',
            'social-image.generate',

            // Local dev helpers (if present)
            'dev.*',
        ],
    ],
];


