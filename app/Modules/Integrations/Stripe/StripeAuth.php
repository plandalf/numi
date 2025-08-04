<?php

namespace App\Modules\Integrations\Stripe;

use App\Enums\IntegrationType;
use App\Modules\Integrations\Contracts\SupportsAuthorization;
use App\Modules\Integrations\Services\IntegrationUpsertService;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Query;
use GuzzleHttp\Psr7\Uri;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\InvalidStateException;

/** @todo implement actual stripe client */
class StripeAuth implements SupportsAuthorization
{
    public function getAuthorizationUrl(IntegrationType $integrationType, Request $request): string
    {
        $integrationType = $integrationType->value;

        /** @var AbstractProvider $socialite */
        $socialite = Socialite::driver($integrationType)->stateless();

        $user = $request->user();

        $targetUrl = new Uri($socialite->redirect()->getTargetUrl());
        $query = Query::parse($targetUrl->getQuery());
        $state = Arr::get($query, 'state', $request->get('state', Str::random(32)));
        $redirectUri = url('/integrations/'.$integrationType.'/callback');
        $query['redirect_uri'] = $redirectUri;
        $query['state'] = $state;

        $targetUrl = $targetUrl->withQuery(Query::build($query));

        Cache::put($state, [
            'organization_id' => $user->current_organization_id,
            'redirect_uri' => $request->get('redirect_uri'),
        ], now()->addMinutes(30));

        return $targetUrl;
    }

    public function handleCallback(IntegrationType $integrationType, Request $request, IntegrationUpsertService $upsert)
    {
        $state = Cache::get($request->input('state'));

        abort_if(! $state, 404, 'Invalid state');

        $uri = new Uri('/products');
        $query = Query::parse($uri->getQuery());

        try {
            $user = Socialite::driver($integrationType->value)
                ->stateless()
                ->user();
        } catch (ClientException $e) {
            $query['error'] = $e->getMessage();

            return redirect()->away($uri->withQuery(Query::build($query)));
        } catch (InvalidStateException $e) {
            $query['error'] = 'invalid_state';

            return redirect()->away($uri->withQuery(Query::build($query)));
        }

        $model = $upsert->fromSocialite($user, $state, $integrationType);

        $query = Query::parse($uri->getQuery());
        $query['integration_id'] = $model->getRouteKey();
        $query['integration_type'] = $model->getMorphClass();

        $redirectUrl = $uri->withQuery(Query::build($query));

        return redirect()->away($redirectUrl);
    }
}
