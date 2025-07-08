<?php

namespace App\Http\Controllers;

use App\Models\Store\Offer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\URL;

class SocialImageController extends Controller
{
    /**
     * Generate a social image for an offer
     * This route accepts a signed URL and returns a beautiful React view
     * optimized for Cloudflare screenshots
     */
    public function generate(Request $request, string $offerId)
    {
        // Validate the signed URL
        // if (! $request->hasValidSignature()) {
        //     abort(403, 'Invalid or expired social image link.');
        // }

        // Retrieve the offer
        $offer = Offer::retrieve($offerId);
        
        if (!$offer) {
            abort(404, 'Offer not found.');
        }

        // Load necessary relationships
        $offer->load([
            'organization.logoMedia',
            'organization.faviconMedia',
            'productImage',
            'theme',
            'offerItems.offerPrices',
            'hostedPage.logoImage',
            'hostedPage.backgroundImage',
        ]);

        // Prepare the data for the social image view
        $socialImageData = [
            'offer' => [
                'id' => $offer->getRouteKey(),
                'name' => $offer->name ?? 'Untitled Offer',
                'description' => $offer->description ?? '',
                'product_image' => $offer->productImage ? [
                    'url' => $offer->productImage->getSignedUrl(300), // 5 minutes for screenshot
                ] : null,
                'status' => $offer->status ?? 'draft',
            ],
            'organization' => [
                'name' => $offer->organization->name ?? 'Unknown Organization',
                'description' => $offer->organization->description ?? '',
                'primary_color' => $offer->organization->primary_color ?? '#3b82f6',
                'logo_media' => $offer->organization->logoMedia ? [
                    'url' => $offer->organization->logoMedia->getSignedUrl(300),
                ] : null,
            ],
            'theme' => $offer->theme ? [
                'primary_color' => $offer->theme->primary_color ?? '#3b82f6',
                'secondary_color' => $offer->theme->secondary_color ?? '#6b7280',
                'background_color' => $offer->theme->background_color ?? '#ffffff',
                'text_color' => $offer->theme->text_color ?? '#1f2937',
                'font_family' => $offer->theme->font_family ?? 'Inter, system-ui, sans-serif',
            ] : null,
            'items' => $offer->offerItems->map(function ($item) {
                return [
                    'name' => $item->name ?? 'Untitled Item',
                    'description' => $item->description ?? '',
                    'prices' => $item->offerPrices->map(function ($price) {
                        return [
                            'amount' => $price->amount ?? 0,
                            'currency' => $price->currency ?? 'USD',
                            'formatted' => $price->formatted_amount ?? '$0.00',
                        ];
                    }),
                ];
            }),
            'hosted_page' => $offer->hostedPage ? [
                'logo_image' => $offer->hostedPage->logoImage ? [
                    'url' => $offer->hostedPage->logoImage->getSignedUrl(300),
                ] : null,
                'background_image' => $offer->hostedPage->backgroundImage ? [
                    'url' => $offer->hostedPage->backgroundImage->getSignedUrl(300),
                ] : null,
                'style' => $offer->hostedPage->style,
            ] : null,
        ];
        // dd($socialImageData);

        return Inertia::render('social-image', $socialImageData);
    }

    /**
     * Generate a signed URL for the social image
     */
    public static function generateSignedUrl(Offer $offer, int $expirationMinutes = 5): string
    {
        return URL::temporarySignedRoute(
            'social-image.generate',
            now()->addMinutes($expirationMinutes),
            ['offer' => $offer->getRouteKey()]
        );
    }
} 