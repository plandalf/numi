<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Cashier\SubscriptionItem as StripeSubscriptionItem;

class SubscriptionItem extends StripeSubscriptionItem
{
    protected $table = 'tenant_subscription_items';

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
