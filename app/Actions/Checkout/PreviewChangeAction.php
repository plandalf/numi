<?php

declare(strict_types=1);

namespace App\Actions\Checkout;

use App\Models\Checkout\CheckoutSession;
use App\Modules\Billing\Changes\ChangeIntent;
use App\Modules\Billing\Changes\ChangePreview;
use App\Modules\Integrations\Contracts\SupportsChangePreview;

final class PreviewChangeAction
{
    public function __invoke(CheckoutSession $session, ChangeIntent $intent): ChangePreview
    {
        $session->loadMissing([
            'lineItems.offerItem',
            'lineItems.price.product',
            'organization.integrations',
        ]);

        $integration = $session->integrationClient();
        if (! $integration instanceof SupportsChangePreview) {
            return ChangePreview::disabled($intent->signal, 'Integration does not support change previews');
        }

        return $integration->previewChange($session, $intent);
    }
}
