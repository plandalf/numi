<?php

namespace App\Modules\Integrations\Contracts;

use App\Enums\IntegrationType;
use App\Modules\Integrations\Services\IntegrationUpsertService;
use Illuminate\Http\Request;

interface SupportsAuthorization
{
    public function getAuthorizationUrl(IntegrationType $integrationType, Request $request): string;

    public function handleCallback(IntegrationType $integrationType, Request $request, IntegrationUpsertService $upsert);
}
