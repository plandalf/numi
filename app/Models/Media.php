<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasFactory;

    protected $table = 'medias';

    protected $fillable = [
        'original_filename',
        'filename',
        'mime_type',
        'size',
        'disk',
        'path',
        'status',
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
        return $this->disk === 's3'
            ? \Storage::disk('s3')->url($this->path)
            : \Storage::disk('public')->url($this->path);
    }

    public function getSignedUrl($expiration = 60)
    {
        // Use processed version if available
        $path = $this->path;

        return Storage::disk('private')->temporaryUrl(
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
