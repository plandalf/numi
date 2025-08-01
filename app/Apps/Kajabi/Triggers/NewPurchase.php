<?php

namespace App\Apps\Kajabi\Triggers;

use App\Workflows\Attributes\IsTrigger;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;

#[IsTrigger(
    key: 'new-purchase',
    noun: 'Purchase',
    label: 'New Purchase',
    description: 'Triggers when a new purchase of an offer is made in Kajabi.',
)]
class NewPurchase extends AppTrigger
{
    /**
     * @param Bundle{input: array{offer: string}} $bundle
     */
    public function __invoke(Bundle $bundle): array
    {
        return [
            'offer_id' => $bundle->input['offer'],
            'triggered_at' => now()->toISOString(),
            'event_type' => 'purchase_created',
        ];
    }

    public static function props(): array
    {
        return [
            Field::string('offer', 'Offer')
                ->dynamic('offer.id,name')
                ->required()
                ->help('Offer to filter on'),
        ];
    }

    public function subscribe(Bundle $bundle): void
    {
        // todo: prompt the user to set this up

        // ensure theres a hook created ?
        //
        // need a way of "testing" a trigger, by looking up an event

        // check first, then subscribe
        // Subscribe to webhook or polling for new purchases
        // This would set up the webhook subscription to Kajabi
    }

    public function unsubscribe(Bundle $bundle): void
    {
        // check first, then unsubscribe
        // Unsubscribe from webhook or polling
        // This would remove the webhook subscription
    }
}
