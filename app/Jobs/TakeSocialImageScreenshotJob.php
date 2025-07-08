<?php

namespace App\Jobs;

use App\Models\Media;
use App\Models\Store\Offer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TakeSocialImageScreenshotJob extends QueueableJob
{
    public function __construct(public Offer $offer)
    {
    }

    public function handle(): void
    {
        if (empty(config('services.cloudflare.account_id'))) {
            logger()->info('social-image-screenshot: no-cloudflare-config');
            return;
        }

        logger()->info('social-image-screenshot: starting', ['offer_id' => $this->offer->id]);

        // Generate the social image URL
        $socialImageUrl = $this->offer->getSocialImageUrl();

        $res = \Illuminate\Support\Facades\Http::baseUrl('https://api.cloudflare.com/client/v4/accounts/'.config('services.cloudflare.account_id'))
            ->withToken(config('services.cloudflare.auth_token'), 'Bearer')
            ->acceptJson()
            ->post('/browser-rendering/screenshot', [
                'url' => $socialImageUrl,
                'addStyleTag' => [
                    [
                        'content' => ' * { scrollbar-width: none; -ms-overflow-style: none; } *::-webkit-scrollbar { display: none; }',
                    ],
                ],
                'screenshotOptions' => [
                    'type' => 'jpeg',
                    'optimizeForSpeed' => true,
                    'quality' => 90,
                ],
                'viewport' => [
                    'width' => 1200,
                    'height' => 630, // Twitter/Facebook optimal size
                ],
                'gotoOptions' => [
                    'waitUntil' => 'networkidle0',
                    'timeout' => 30000,
                ],
            ]);

        if (!$res->ok()) {
            logger()->error('social-image-screenshot: cloudflare-error', [
                'status' => $res->status(),
                'response' => $res->json(),
                'offer_id' => $this->offer->id,
            ]);
            return;
        }

        // Check if offer already has a social image
        $existingSocialImage = $this->offer->socialImage;
        
        if ($existingSocialImage) {
            // Update existing social image
            logger()->info('social-image-screenshot: updating-existing', [
                'offer_id' => $this->offer->id,
                'social_image_id' => $existingSocialImage->id,
            ]);
            
            // Update the existing media record
            $existingSocialImage->update([
                'size' => $res->getBody()->getSize(),
            ]);
            
            // Replace the file content
            Storage::put($existingSocialImage->path, $res->body(), 'private');
            
            logger()->info('social-image-screenshot: updated-existing-social-image', [
                'offer_id' => $this->offer->id,
                'social_image_id' => $existingSocialImage->id,
            ]);
        } else {
            // Create new social image
            logger()->info('social-image-screenshot: creating-new', ['offer_id' => $this->offer->id]);
            
            $uuid = Str::uuid();
            $filename = $uuid.'.jpg';
            $disk = config('filesystems.default');
            $key = sprintf(
                'm/%s/%s.%s',
                $uuid,
                Str::slug(pathinfo($filename, PATHINFO_FILENAME)),
                'jpg'
            );

            $media = Media::create([
                'original_filename' => $this->offer->getRouteKey().'-social-screenshot.jpg',
                'filename' => $filename,
                'mime_type' => 'image/jpeg',
                'size' => $res->getBody()->getSize(),
                'disk' => $disk,
                'path' => $key,
                'status' => Media::STATUS_READY,
                'uuid' => $uuid,
                'meta' => [
                    'type' => 'social_image_screenshot',
                    'generated_at' => now()->toISOString(),
                ],
                'user_id' => null, // System generated
                'organization_id' => $this->offer->organization_id,
            ]);

            // Store the file
            Storage::put($media->path, $res->body(), 'private');

            // Associate with offer
            Offer::withoutEvents(function () use ($media) {
                $this->offer->socialImage()->associate($media);
                $this->offer->save();
            });

            logger()->info('social-image-screenshot: created-new-social-image', [
                'offer_id' => $this->offer->id,
                'social_image_id' => $media->id,
            ]);
        }
    }
} 