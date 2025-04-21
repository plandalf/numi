<?php

namespace App\Enums;

enum CheckoutSessionStatus: string
{
    case STARTED = 'started';
    case CLOSED = 'closed';
    case FAILED = 'failed';
}
