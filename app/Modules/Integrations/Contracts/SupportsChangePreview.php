<?php

declare(strict_types=1);

namespace App\Modules\Integrations\Contracts;

use App\Models\Checkout\CheckoutSession;
use App\Modules\Billing\Changes\ChangeIntent;
use App\Modules\Billing\Changes\ChangePreview;
use App\Modules\Billing\Changes\ChangeResult;

interface SupportsChangePreview
{
    public function previewChange(CheckoutSession $session, ChangeIntent $intent): ChangePreview;

    public function commitChange(CheckoutSession $session, ChangePreview $preview): ChangeResult;
}
