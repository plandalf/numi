<?php

namespace App\Http\Resources;

use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use App\Models\Theme;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Offer
 */
class OfferResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getRouteKey(),
            'name' => $this->name,
            'description' => $this->description,
            'product_image_id' => $this->product_image_id,
            'product_image' => $this->whenLoaded('productImage', function () {
                return [
                    'id' => $this->product_image_id,
                    'url' => $this->productImage->getSignedUrl(),
                ];
            }),
            'screenshot' => $this->whenLoaded('screenshot', function () {
                return [
                    'url' => url($this->screenshot->path),
                ];
            }, null),
            'social_image' => $this->whenLoaded('socialImage', function () {
                return [
                    'id' => $this->socialImage->getRouteKey(),
                    'url' => $this->socialImage->getSignedUrl(),
                ];
            }, null),
            'status' => $this->status,
            'organization_id' => $this->organization_id,
            'view' => $this->view,
            'properties' => $this->properties,
            'checkout_success_url' => $this->checkout_success_url ?? $this->whenLoaded('organization', function () {
                return $this->organization->checkout_success_url;
            }, null),
            'checkout_cancel_url' => $this->checkout_cancel_url ?? $this->whenLoaded('organization', function () {
                return $this->organization->checkout_cancel_url;
            }, null),

            'is_hosted' => $request->filled('numi-embed-type') ? false : $this->is_hosted,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'public_url' => $this->whenLoaded('organization', function () {
                return $this->public_url;
            }),
            'test_checkout_url' => $this->whenLoaded('organization', function () {
                return $this->getTestCheckoutUrl();
            }),
            'organization' => $this->whenLoaded('organization', function () {
                return [
                    'id' => $this->organization->id,
                    'name' => $this->organization->name,
                    'description' => $this->organization->description,
                    'website_url' => $this->organization->website_url,
                    'logo_media_id' => $this->organization->logo_media_id,
                    'logo_media' => $this->organization->logoMedia ? [
                        'id' => $this->organization->logo_media_id,
                        'url' => $this->organization->logoMedia->getSignedUrl(),
                        'signed_url' => $this->organization->logoMedia->getSignedUrl(),
                    ] : null,
                    'favicon_media_id' => $this->organization->favicon_media_id,
                    'favicon_media' => $this->organization->faviconMedia ? [
                        'id' => $this->organization->favicon_media_id,
                        'url' => $this->organization->faviconMedia->getSignedUrl(),
                        'signed_url' => $this->organization->faviconMedia->getSignedUrl(),
                    ] : null,
                    'primary_color' => $this->organization->primary_color,
                    'social_media' => $this->organization->social_media,
                    'subdomain' => $this->organization->subdomain,
                ];
            }),
            'items' => OfferItemResource::collection($this->whenLoaded('offerItems')),
            'theme' => new ThemeResource($this?->theme ?? new Theme),
            'hosted_page' => $this->whenLoaded('hostedPage', function () {
                return new HostedPageResource($this?->hostedPage);
            }, null),
        ];
    }
}
