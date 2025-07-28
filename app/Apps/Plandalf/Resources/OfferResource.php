<?php

namespace App\Apps\Plandalf\Resources;

use App\Workflows\Attributes\IsResource;
use App\Workflows\Automation\Resource as BaseResource;

#[IsResource(
    key: 'offer',
    noun: 'Offer',
    label: 'Offer',
    description: 'Plandalf offers that can be purchased.'
)]
class OfferResource extends BaseResource
{

    public function search(array $query = []): array
    {
        // search per "org"

        return [
            [
                'value' => 1,
                'label' => 2,
            ],
        ];
    }

    public function get(string $id): ?array
    {
        // TODO: Implement get() method.
    }

    public function getValueLabelFields(): array
    {
        return [
            'value' => 'id',
            'label' => 'name',
        ];
    }
}
