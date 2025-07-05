<?php

namespace App\Enums;

use Dedoc\Scramble\Attributes\SchemaName;

#[SchemaName('Status')]
enum CheckoutSessionStatus: string
{
    /**
     * The session has been created and is ready for use.
     */
    case STARTED = 'started';

    /**
     * The session has been completed successfully.
     */
    case CLOSED = 'closed';

    /**
     * The session has been canceled by the user or system.
     */
    case FAILED = 'failed';
}
