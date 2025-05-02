<?php

namespace App\Models;

use App\Database\Traits\UuidRouteKey;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasFactory,
        UuidRouteKey;

    protected $table = 'medias';

    protected $fillable = [
        'original_filename',
        'filename',
        'mime_type',
        'size',
        'disk',
        'path',
        'status',
        'uuid',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'size' => 'integer',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';    // Upload URL generated but upload not completed

    const STATUS_UPLOADED = 'uploaded';   // File uploaded but not finalized

    const STATUS_READY = 'ready';        // File processed and ready for use

    const STATUS_FAILED = 'failed';      // Upload or processing failed

    /**
     * The model that owns the media
     */
    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the full URL to the media file
     */
    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    public function getSignedUrl($expiration = 60)
    {
        // Use processed version if available
        $path = $this->path;

        return Storage::disk($this->disk)->temporaryUrl(
            $path,
            now()->addMinutes($expiration)
        );
    }

    /**
     * Scope a query to only include ready media
     */
    public function scopeReady($query)
    {
        return $query->where('status', self::STATUS_READY);
    }
}
