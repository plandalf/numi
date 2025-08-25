<?php

namespace App\Workflows\Automation;

use App\Models\Integration;
use App\Models\Organization;
use Illuminate\Queue\SerializesModels;

class Bundle
{
    use SerializesModels;

    public function __construct(
        public Organization $organization,
        public ?array $input = [],
        public ?array $configuration = [],
        public ?Integration $integration = null,
    ) {
        Log::info('Bundle created', [
            'organization_id' => $organization->id,
            'integration_id' => $integration?->id,
        ]);
    }
}
