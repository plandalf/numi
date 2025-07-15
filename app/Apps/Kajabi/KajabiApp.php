<?php

namespace App\Apps\Kajabi;

use App\Apps\AutomationApp;
use App\Apps\Kajabi\Actions\CreateContactTag;
use App\Apps\Kajabi\Actions\CreateMember;
use App\Apps\Kajabi\Resources\OfferResource;
use App\Apps\Kajabi\Triggers\NewPurchase;
use App\Models\Integration;

// AutomationApp
class KajabiApp extends AutomationApp
{
    public function actions(): array
    {
        return [
            CreateContactTag::class,
            CreateMember::class,
        ];
    }

    public function triggers(): array
    {
        return [
            NewPurchase::class,
        ];
    }

    public function resources(): array
    {
        return [
            OfferResource::class,
        ];
    }

    public function auth(Integration $integration)
    {
        $connector = new KajabiConnector(
            clientId: $integration->connection_config['client_id'],
            clientSecret: $integration->connection_config['client_secret'],
        );

        $authenticator = $connector->getAccessToken();
        $refreshToken = $authenticator->getRefreshToken();

        $connector->authenticate($authenticator);

        // no idea why, but this works
        $newAuthenticator = $connector->refreshAccessToken($refreshToken);

        $connector->authenticate($newAuthenticator);

        return $newAuthenticator;
    }
}
