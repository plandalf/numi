<?php

namespace App\Apps\Kajabi\Resources;

use App\Apps\Kajabi\KajabiApp;
use App\Apps\Kajabi\Requests\GetOffersRequest;
use App\Models\Integration;
use App\Workflows\Attributes\IsResource;
use App\Workflows\Automation\Resource as BaseResource;

#[IsResource(
    key: 'offer',
    noun: 'Offer',
    label: 'Offer',
    description: 'Kajabi offers that can be purchased.'
)]
class OfferResource extends BaseResource
{
    public function search(array $query = []): array
    {
        $kajabiApp = new KajabiApp();
        $connector = $kajabiApp->auth($this->integration);

        $request = new GetOffersRequest();

        // Add search filter if provided
        if (!empty($query['search'])) {
            $request->query()->add('filter[title_cont]', $query['search']);
        }

        $response = $connector->send($request);

        if ($response->failed()) {
            throw new \Exception('Failed to fetch offers from Kajabi: ' . $response->body());
        }

        $data = $response->json('data', []);

        // Format for frontend
        return array_map(function ($offer) {
            return [
                'value' => $offer['id'],
                'label' => $offer['attributes']['title'] ?? 'Untitled Offer',
                'data' => $offer,
            ];
        }, $data);
    }

    public function get(string $id): ?array
    {
        $kajabiApp = new KajabiApp();
        $connector = $kajabiApp->auth($this->integration);

        $response = $connector->send(new GetOffersRequest(['id' => $id]));

        if ($response->failed()) {
            throw new \Exception('Failed to fetch offer from Kajabi: ' . $response->body());
        }

        $data = $response->json('data', []);
        return $data[0] ?? null;
    }

    public function getValueLabelFields(): array
    {
        return [
            'value' => 'id',
            'label' => 'name',
        ];
    }
}
