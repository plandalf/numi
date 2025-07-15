<?php

namespace App\Apps\Kajabi;

use DateInterval;
use DateTimeImmutable;
use InvalidArgumentException;
use Saloon\Contracts\OAuthAuthenticator;
use Saloon\Helpers\OAuth2\OAuthConfig;
use Saloon\Http\Auth\AccessTokenAuthenticator;
use Saloon\Http\OAuth2\GetClientCredentialsTokenRequest;
use Saloon\Http\OAuth2\GetRefreshTokenRequest;
use Saloon\Http\Request;
use Saloon\Http\Response;
use Saloon\Traits\OAuth2\HasOAuthConfig;

trait KajabiClientCredentialsGrant
{
    use HasOAuthConfig;

    public function getAccessToken(array $scopes = [], string $scopeSeparator = ' ', bool $returnResponse = false, ?callable $requestModifier = null): OAuthAuthenticator|Response
    {
        $this->oauthConfig()->validate(withRedirectUrl: false);

        $request = $this->resolveAccessTokenRequest($this->oauthConfig(), $scopes, $scopeSeparator);

        $request = $this->oauthConfig()->invokeRequestModifier($request);

        if (is_callable($requestModifier)) {
            $requestModifier($request);
        }

        $response = $this->send($request);

        if ($returnResponse === true) {
            return $response;
        }

        $response->throw();

        return $this->createOAuthAuthenticatorFromResponse($response);
    }

    protected function createOAuthAuthenticatorFromResponse(Response $response): OAuthAuthenticator
    {
        $responseData = $response->object();

        $accessToken = $responseData->access_token;
        $expiresAt = null;

        if (isset($responseData->expires_in) && is_numeric($responseData->expires_in)) {
            $expiresAt = (new DateTimeImmutable)->add(
                DateInterval::createFromDateString((int)$responseData->expires_in . ' seconds')
            );
        }

        return $this->createOAuthAuthenticator($accessToken, $responseData->refresh_token, $expiresAt);
    }

    public function refreshAccessToken(OAuthAuthenticator|string $refreshToken, bool $returnResponse = false, ?callable $requestModifier = null): OAuthAuthenticator|Response
    {
        $this->oauthConfig()->validate();

        if ($refreshToken instanceof OAuthAuthenticator) {
            if ($refreshToken->isNotRefreshable()) {
                throw new InvalidArgumentException('The provided OAuthAuthenticator does not contain a refresh token.');
            }

            $refreshToken = $refreshToken->getRefreshToken();
        }

        $request = $this->resolveRefreshTokenRequest($this->oauthConfig(), $refreshToken);

        $request = $this->oauthConfig()->invokeRequestModifier($request);

        if (is_callable($requestModifier)) {
            $requestModifier($request);
        }

        $response = $this->send($request);

        if ($returnResponse === true) {
            return $response;
        }

        $response->throw();

        return $this->createOAuthAuthenticatorFromResponse($response, $refreshToken);
    }

    protected function resolveRefreshTokenRequest(OAuthConfig $oauthConfig, string $refreshToken): Request
    {
        return new GetRefreshTokenRequest($oauthConfig, $refreshToken);
    }


    /**
     * Create the authenticator.
     */
    protected function createOAuthAuthenticator(string $accessToken, string $refreshToken, ?DateTimeImmutable $expiresAt = null): OAuthAuthenticator
    {
        return new AccessTokenAuthenticator($accessToken, $refreshToken, $expiresAt);
    }

    /**
     * Resolve the access token request
     */
    protected function resolveAccessTokenRequest(OAuthConfig $oauthConfig, array $scopes = [], string $scopeSeparator = ' '): Request
    {
        return new GetClientCredentialsTokenRequest($oauthConfig, $scopes, $scopeSeparator);
    }
}
