<?php

namespace App\Modules\Integrations\Services;

use App\Enums\IntegrationType;
use App\Models\Integration;
use App\Services\BaseService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Laravel\Socialite\AbstractUser;
use SocialiteProviders\Manager\OAuth2\User;

class IntegrationUpsertService extends BaseService
{
    public function fromSocialite(AbstractUser $user, array $state, IntegrationType $integrationType): Model
    {
        $model = match ($integrationType) {
            IntegrationType::STRIPE, IntegrationType::STRIPE_TEST => $this->fromStripe($user, $state, $integrationType),
            default => throw new \InvalidArgumentException("Unsupported integration type: $integrationType->value"),
        };

        return $model;
    }

    protected function fromStripe(User $user, array $state, IntegrationType $integrationType): Integration
    {
        $environment = $user->accessTokenResponseBody['livemode'] ?? false ? 'live' : 'test';

        /** @var Integration $integration */
        $integration = Integration::query()
            ->updateOrCreate([
                'organization_id' => Arr::get($state, 'organization_id'),
                'lookup_key' => $user->getId(),
                'type' => $integrationType->value,
            ], [
                'environment' => $environment,
                'name' => $user->nickname.'('.$environment.')',
                'secret' => $user->token,
                'config' => array_merge(
                    ['access_token' => $user->accessTokenResponseBody],
                    ['user_raw' => $user->getRaw()],
                ),
            ]);

        return $integration;
    }
}
