<?php

namespace App\Apps\Kajabi;

use App\Apps\AutomationApp;
use App\Apps\Kajabi\Actions\CreateContactTag;
use App\Apps\Kajabi\Actions\CreateMember;
use App\Apps\Kajabi\Actions\FindOrCreateContact;
use App\Apps\Kajabi\Resources\ContactResource;
use App\Apps\Kajabi\Resources\OfferResource;
use App\Apps\Kajabi\Triggers\NewPurchase;
use App\Models\Integration;
use App\Workflows\Attributes\IsAutomation;

// allow this to register itself
#[IsAutomation(
    key: 'kajabi',
    name: 'Kajabi',
    description: 'Connect your Kajabi site to automate member management, order processing, and course delivery.',
    version: '1.0.0',
    provider_url: 'https://kajabi.com',
)]
class KajabiApp extends AutomationApp
{
    public function actions(): array
    {
        return [
            CreateContactTag::class,
            CreateMember::class,
            FindOrCreateContact::class,
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
            ContactResource::class,
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

        // NOTE: no idea why, but this works
        $newAuthenticator = $connector->refreshAccessToken($refreshToken);

        $connector->authenticate($newAuthenticator);

        return $connector;
    }

    public function authRequirements(): array
    {
        return [
            'type' => 'oauth_client_credentials',
            'fields' => [
                [
                    'key' => 'client_id',
                    'label' => 'Client ID',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter your Kajabi Client ID',
                    'help' => 'Your Kajabi API Client ID from your app settings'
                ],
                [
                    'key' => 'client_secret',
                    'label' => 'Client Secret',
                    'type' => 'password',
                    'required' => true,
                    'placeholder' => 'Enter your Kajabi Client Secret',
                    'help' => 'Your Kajabi API Client Secret from your app settings'
                ],
                [
                    'key' => 'site_id',
                    'label' => 'Site ID',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter your Kajabi Site ID',
                    'help' => 'Your Kajabi Site ID, found in your Kajabi account settings'
                ]
            ]
        ];
    }

    /**
     * Test Kajabi integration by making a real API call
     */
    public function test($integration): array
    {
        try {
            $connector = $this->auth($integration);

            // Test with MeRequest to verify credentials work
            $meRequest = new \App\Apps\Kajabi\Requests\MeRequest();
            $response = $connector->send($meRequest);

            if ($response->failed()) {
                throw new \Exception('Failed to authenticate with Kajabi: ' . $response->body());
            }

            $data = $response->json();
            return [
                'status' => 'connected',
                'test_time' => now()->toISOString(),
                'user_info' => [
                    'id' => $data['id'] ?? null,
                    'email' => $data['email'] ?? null,
                    'name' => $data['name'] ?? null,
                ],
                'message' => 'Successfully connected to Kajabi and verified credentials'
            ];
        } catch (\Exception $e) {
            throw new \Exception('Kajabi connection test failed: ' . $e->getMessage());
        }
    }
}
