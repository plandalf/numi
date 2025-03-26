<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
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
        $filename = Str::uuid() . '.' . $extension;
        $path = 'uploads/' . $filename;

        // Create a pending media record
        $media = Media::create([
            'original_filename' => $request->filename,
            'filename' => $filename,
            'mime_type' => $request->mime_type,
            'size' => $request->size,
            'disk' => 's3',
            'path' => $path,
            'status' => Media::STATUS_PENDING,
            'meta' => [
                'upload_started_at' => now(),
            ],
        ]);

        // Generate a signed S3 upload URL
        $url = Storage::disk('s3')->temporaryUploadUrl(
            $path,
            now()->addMinutes(30),
            [
                'Content-Type' => $request->mime_type,
                'Content-Length' => $request->size,
            ]
        );

        //['url' => $uploadUrl, 'headers' => $headers] = Storage::disk('r2')->temporaryUploadUrl(
        //     $key,
        //     now()->addMinutes($isVideo ? 30 : 5)
        // );

        return response()->json([
            'media_id' => $media->id,
            'upload_url' => $url,
        ]);
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
        if (!Storage::disk('s3')->exists($media->path)) {
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
            'media' => $media->fresh(),
        ]);
    }
}
