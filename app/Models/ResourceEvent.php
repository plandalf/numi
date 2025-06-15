<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ResourceEvent extends Model
{
    protected $table = 'resource_events';

    protected $fillable = [
        'organization_id',
        'action',
        'subject_type',
        'subject_id',
        'snapshot',
    ];

    protected $casts = [
        'snapshot' => 'json',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
    
    /**
     * Create a test event for workflow testing
     */
    public static function createTestEvent(array $testData, int $organizationId): self
    {
        return new self([
            'organization_id' => $organizationId,
            'action' => 't', // 't' for test
            'subject_type' => 'test',
            'subject_id' => 1,
            'snapshot' => $testData,
        ]);
    }
}
