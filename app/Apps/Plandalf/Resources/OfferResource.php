<?php

namespace App\Apps\Plandalf\Resources;

use App\Models\Store\Offer;
use App\Workflows\Attributes\IsResource;
use App\Workflows\Automation\Resource as BaseResource;
use Illuminate\Support\Facades\Auth;

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
        return Auth::user()
            ->currentOrganization
            ->offers
            ->map(function (Offer $offer) {
                return [
                    'value' => $offer->id,
                    'label' => $offer->name ?? 'Untitled Offer',
                ];
            })
            ->toArray();
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
