<?php

declare(strict_types=1);

namespace App\Modules\Integrations\Contracts;

interface SupportsSubscriptionPreview
{
    /**
     * Retrieve a subscription object by its gateway identifier.
     * Implementations should return the provider's subscription payload object.
     */
    public function retrieveSubscription(string $subscriptionId, array $options = []): object;

    /**
     * Preview the upcoming invoice for a subscription swap/change.
     * Implementations should return the provider's upcoming invoice payload object.
     *
     * The $params map should align with the provider API expectations.
     */
    public function previewUpcomingInvoice(array $params): object;
}
