<?php

namespace App\Jobs;

use App\Models\Store\Offer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class TakeOfferScreenshotJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Offer $offer)
    {
    }

    public function handle(): void
    {
        if (empty(config('services.cloudflare.account_id'))) {
            return;
        }

        $res = \Illuminate\Support\Facades\Http::baseUrl('https://api.cloudflare.com/client/v4/accounts/'.config('services.cloudflare.account_id'))
            ->withToken(config('services.cloudflare.auth_token'), 'Bearer')
            ->acceptJson()
            ->post('/browser-rendering/screenshot', [
                'url' => route('offers.show', [$this->offer, 'test']),
                'screenshotOptions' => [
                    'type' => 'jpeg',
                    'optimizeForSpeed' => true,
                    'clip' => [
                        'scale' => 0.5
                    ],
                ],
                'viewport' => [
                    'width' => 1280,
                    'height' => 720,
                ],
                'gotoOptions' => [
                    'waitUntil' => 'networkidle0',
                    'timeout' => 45000,
                ],
            ]);

        \App\Models\Media::query()
            ->create([
                'original_filename' => null,
                'filename' => null,
                'mime_type' => null,
                'size' => null,
                'disk' => null,
                'path' => null,
                'status' => null,
                'uuid' => null,
                'meta' => null,
            ]);

        Storage::put('screenshot.jpg', $res->body());

    // media->mediable() // associate "screenshot"

        Offer::withoutEvents(function () {
//            $this->offer->screenshot()->associate($media);
        });
    }
}
