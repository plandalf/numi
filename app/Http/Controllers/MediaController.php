<?php

namespace App\Http\Controllers;

use App\Http\Resources\MediaResource;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MediaController extends Controller
{
    /**
     * Generate a signed upload URL for direct S3 upload
     */
    public function generateUploadUrl(Request $request)
    {
        $request->validate([
            'filename' => 'required|string',
            'mime_type' => 'required|string|starts_with:image/',
            'size' => 'required|integer|min:1|max:10485760', // 10MB max
        ]);

        // Generate a unique filename
        $extension = pathinfo($request->filename, PATHINFO_EXTENSION);
        $uuid = Str::uuid();
        $filename = $uuid.'.'.$extension;

        $key = sprintf(
            'm/%s/%s.%s',
            $uuid,
            Str::slug(pathinfo($filename, PATHINFO_FILENAME)),
            $extension
        );
        $disk = config('filesystems.default');

        // Create a pending media record
        $media = Media::create([
            'original_filename' => $request->filename,
            'filename' => $filename,
            'mime_type' => $request->mime_type,
            'size' => $request->size,
            'disk' => $disk,
            'path' => $key,
            'uuid' => $uuid,
            'status' => Media::STATUS_PENDING,
            'meta' => [
                'upload_started_at' => now(),
            ],
        ]);

        ['url' => $uploadUrl, 'headers' => $headers] = $disk === 'local'
            ? [
                'url' => route('medias.upload', $media),
                'headers' => [],
            ] : Storage::disk($disk)->temporaryUploadUrl(
            $key,
            now()->addMinutes(10)
        );

        return response()->json([
            'uuid' => $uuid,
            'key' => $key,
            'uploadUrl' => $uploadUrl,
            'headers' => $headers,
            'media_id' => $media->getRouteKey(),
            'publicUrl' => $media->getSignedUrl(),
        ], 201);
    }

    public function upload(Media $media, Request $request)
    {
        Storage::disk($media->disk)->put(
            $media->path,
            $request->getContent(),
            'private'
        );
    }

    /**
     * Finalize a media upload
     */
    public function finalizeUpload(Request $request, Media $media)
    {
        if ($media->status !== Media::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'media' => ['This media upload cannot be finalized.'],
            ]);
        }

        // Verify the file exists in S3
        if (! Storage::disk($media->disk)->exists($media->path)) {
            throw ValidationException::withMessages([
                'media' => ['The file has not been uploaded.'],
            ]);
        }

        // Update media status
        $media->update([
            'status' => Media::STATUS_READY,
            'meta' => array_merge($media->meta ?? [], [
                'finalized_at' => now(),
            ]),
        ]);

        return response()->json([
            'data' => new MediaResource($media->refresh()),
        ]);
    }
}
