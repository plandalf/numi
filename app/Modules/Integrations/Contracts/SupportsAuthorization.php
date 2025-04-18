<?php

namespace App\Modules\Integrations\Contracts;

use Illuminate\Http\Request;
use App\Enums\IntegrationType;
use App\Modules\Integrations\Services\IntegrationUpsertService;

interface SupportsAuthorization
{
    public function getAuthorizationUrl(IntegrationType $integrationType, Request $request): string;

    public function handleCallback(IntegrationType $integrationType, Request $request, IntegrationUpsertService $upsert);
}