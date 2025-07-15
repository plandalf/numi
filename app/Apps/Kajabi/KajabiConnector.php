<?php

namespace App\Apps\Kajabi;

use Saloon\Http\Connector;

class KajabiConnector extends Connector
{
    use KajabiClientCredentialsGrant;

    public function __construct(
        protected string $clientId,
        protected string $clientSecret,
    ) {
        $this->oauthConfig()
            ->setClientId($clientId)
            ->setClientSecret($clientSecret)
            ->setRedirectUri(' ')
            ->setTokenEndpoint('oauth/token')
            ->setDefaultScopes([])
            ->setUserEndpoint('me');
    }

    public function resolveBaseUrl(): string
    {
        return 'https://api.kajabi.com/v1';
    }

    protected function defaultHeaders(): array
    {
        return [
            'Accept' => 'application/json',
        ];
    }
}
