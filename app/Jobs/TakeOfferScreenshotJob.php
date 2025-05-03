<?php

namespace App\Jobs;

use App\Models\Media;
use App\Models\Store\Offer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TakeOfferScreenshotJob extends QueueableJob
{
    public function __construct(public Offer $offer)
    {
    }

    public function handle(): void
    {
        if (empty(config('services.cloudflare.account_id'))) {
            logger()->info(logname('no-cloudflare'));
            return;
        }

        logger()->info(logname('running!'));

        $res = \Illuminate\Support\Facades\Http::baseUrl('https://api.cloudflare.com/client/v4/accounts/'.config('services.cloudflare.account_id'))
            ->withToken(config('services.cloudflare.auth_token'), 'Bearer')
            ->acceptJson()
            ->post('/browser-rendering/screenshot', [
                'url' => route('offers.show', [$this->offer, 'test']),
                'screenshotOptions' => [
                    'type' => 'jpeg',
                    'optimizeForSpeed' => true,
//                    'clip' => [
//                        'scale' => 0.5
//                    ],
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

        if (!$res->ok()) {
            logger()->info(logname('not-ok'), [
                'status' => $res->status(),
                'json' => $res->json(),
            ]);

            return;
        }

        $uuid = Str::uuid();
        $filename =  $uuid.'.jpg';
        $disk = config('filesystems.default');
        $key = sprintf(
            'm/%s/%s.%s',
            $uuid,
            Str::slug(pathinfo($filename, PATHINFO_FILENAME)),
            'jpg'
        );

        $media = \App\Models\Media::query()
            ->create([
                'original_filename' => $this->offer->getRouteKey().'-screenshot.jpg',
                'filename' =>   $filename,
                'mime_type' => 'image/jpeg',
                'size' => $res->getBody()->getSize(),
                'disk' => $disk,
                'path' => $key,
                'status' => Media::STATUS_READY,
                'uuid' => $uuid,
                'meta' => null,
            ]);
//        dump($media);

        logger()->info(logname('finished'));
        Storage::put($media->path, $res->body(), 'private');
        logger()->info(logname('put'));

    // media->mediable() // associate "screenshot"

        Offer::withoutEvents(function () use ($media) {
            $this->offer->screenshot()->associate($media);
            $this->offer->save();
        });
        logger()->info(logname('saved'));
    }
}
