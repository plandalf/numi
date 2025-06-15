<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Automation\App;

class AppSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $apps = [
            [
                'key' => 'email',
                'name' => 'Email',
                'description' => 'Send emails via SMTP or email service providers',
                'color' => '#ea4335',
                'category' => 'communication',
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'none' // Allow testing without authentication for now
                ],
                'actions' => [],
                'triggers' => [],
            ],
            [
                'key' => 'webhook',
                'name' => 'Webhook',
                'description' => 'Send HTTP requests to external services',
                'color' => '#6366f1',
                'category' => 'developer',
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'none'
                ],
                'actions' => [],
                'triggers' => [
                    [
                        'key' => 'webhook_received',
                        'name' => 'Webhook Received',
                        'description' => 'Triggers when a webhook is received',
                        'webhook_config' => [
                            'method' => 'POST',
                            'authentication' => 'optional'
                        ]
                    ]
                ],
                'webhook_config' => [
                    'supported_methods' => ['POST', 'GET', 'PUT'],
                    'max_payload_size' => '10MB'
                ]
            ],
            [
                'key' => 'slack',
                'name' => 'Slack',
                'description' => 'Send messages and interact with Slack',
                'color' => '#4a154b',
                'category' => 'communication',
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'oauth2',
                    'scopes' => ['chat:write', 'channels:read', 'users:read'],
                    'authorize_url' => 'https://slack.com/oauth/v2/authorize',
                    'token_url' => 'https://slack.com/api/oauth.v2.access'
                ],
                'actions' => [],
                'triggers' => [],
                'rate_limits' => [
                    'requests_per_minute' => 60,
                    'burst_limit' => 100
                ]
            ],
            [
                'key' => 'discord',
                'name' => 'Discord',
                'description' => 'Send messages to Discord channels',
                'color' => '#5865f2',
                'category' => 'communication',
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'webhook',
                    'fields' => [
                        'webhook_url' => ['label' => 'Discord Webhook URL', 'type' => 'url', 'required' => true, 'placeholder' => 'https://discord.com/api/webhooks/...']
                    ]
                ],
                'actions' => [],
                'triggers' => []
            ],
            [
                'key' => 'google_sheets',
                'name' => 'Google Sheets',
                'description' => 'Read and write data to Google Sheets',
                'color' => '#34a853',
                'category' => 'productivity',
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'oauth2',
                    'scopes' => ['https://www.googleapis.com/auth/spreadsheets'],
                    'authorize_url' => 'https://accounts.google.com/o/oauth2/auth',
                    'token_url' => 'https://oauth2.googleapis.com/token'
                ],
                'actions' => [],
                'triggers' => []
            ]
        ];

        foreach ($apps as $appData) {
            App::updateOrCreate(
                ['key' => $appData['key']],
                $appData
            );
        }
    }
}
