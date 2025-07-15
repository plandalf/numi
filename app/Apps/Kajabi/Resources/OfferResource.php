<?php

namespace App\Apps\Kajabi\Resources;

use App\Apps\Kajabi\KajabiApp;
use App\Apps\Kajabi\Requests\GetOffersRequest;
use App\Models\Integration;
use App\Modules\Integrations\Kajabi;
use App\Workflows\Attributes\Resource;
use App\Workflows\Automation\Resource as BaseResource;

#[Resource(
    key: 'offer',
    noun: 'Offer',
    label: 'Offer',
    description: 'Kajabi offers that can be purchased.'
)]
class OfferResource extends BaseResource
{
    public function search(array $query = []): array
    {
        $config = $this->integration->config;
        $kajabi = new Kajabi(
            $config['client_id'] ?? '',
            $config['client_secret'] ?? '',
            $config['subdomain'] ?? ''
        );
        $connector = $kajabi->auth($this->integration);
        if (!is_object($connector)) {
            return [];
        }
        
        try {
            $response = $connector->send(new GetOffersRequest());
            
            if ($response->failed()) {
                return [];
            }
            
            $offers = $response->json('offers', []);
            $searchTerm = $query['search'] ?? '';
            
            // Filter offers if search term is provided
            if ($searchTerm) {
                $offers = array_filter($offers, function ($offer) use ($searchTerm) {
                    return stripos($offer['name'] ?? '', $searchTerm) !== false;
                });
            }
            
            // Format for frontend
            return array_map(function ($offer) {
                return [
                    'value' => $offer['id'],
                    'label' => $offer['name'],
                    'data' => $offer,
                ];
            }, $offers);
            
        } catch (\Exception $e) {
            return [];
        }
    }

    public function get(string $id): ?array
    {
        $config = $this->integration->config;
        $kajabi = new Kajabi(
            $config['client_id'] ?? '',
            $config['client_secret'] ?? '',
            $config['subdomain'] ?? ''
        );
        $connector = $kajabi->auth($this->integration);
        if (!is_object($connector)) {
            return null;
        }
        
        try {
            $response = $connector->send(new GetOffersRequest(['id' => $id]));
            
            if ($response->failed()) {
                return null;
            }
            
            $offers = $response->json('offers', []);
            return $offers[0] ?? null;
            
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getValueLabelFields(): array
    {
        return [
            'value' => 'id',
            'label' => 'name',
        ];
    }
} 