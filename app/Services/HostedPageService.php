<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Store\Offer;
use App\Models\HostedPage;

class HostedPageService
{
    /**
     * Update or create a hosted page for an offer
     */
    public function updateViaOffer(Offer $offer, array $data): HostedPage
    {
        $hostedPage = $offer->hostedPage;

        if (!$hostedPage) {
            $hostedPage = new HostedPage([
                'organization_id' => $offer->organization_id,
            ]);
        }

        $hostedPage->fill([
            'logo_image_id' => $data['logo_image_id'] ?? null,
            'background_image_id' => $data['background_image_id'] ?? null,
            'style' => $data['style'] ?? [],
        ]);

        $hostedPage->save();

        // Associate the hosted page with the offer
        if (!$offer->hosted_page_id) {
            $offer->hosted_page_id = $hostedPage->id;
            $offer->save();
        }

        return $hostedPage->load(['logoImage', 'backgroundImage']);
    }
} 