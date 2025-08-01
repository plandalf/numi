<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use App\Models\App;
use App\Models\Automation\Sequence;
use Illuminate\Database\Seeder;

class AutomationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demoOrg = Organization::where('name', 'Demo Organization')->first();
        $adminUser = User::where('email', 'dev@plandalf.com')->first();

        if (!$demoOrg || !$adminUser) {
            $this->command->error('Demo organization or admin user not found. Please run OrganizationSeeder first.');
            return;
        }

        $this->command->info('Creating automation platform data...');

        // Create Apps
        $apps = $this->createApps($demoOrg);

        // Create Integrations
        $integrations = $this->createIntegrations($demoOrg, $apps);

        // Create Automation Sequences
        $this->createAutomationSequences($demoOrg, $adminUser, $integrations);

        $this->command->info('Automation platform data created successfully!');
    }

    private function createApps(Organization $demoOrg): array
    {
        $apps = [];

        // Shopify App
        $shopify = App::updateOrCreate(
            ['key' => 'shopify'],
            [
                'name' => 'Shopify',
                'description' => 'E-commerce platform integration',
                'icon_url' => '/icons/shopify.svg',
                'color' => '#96bf48',
                'category' => 'ecommerce',
                'version' => '2023.10.0',
                'is_active' => true,
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'oauth2',
                    'auth_url' => 'https://shopify.com/admin/oauth/authorize',
                    'token_url' => 'https://shopify.com/admin/oauth/access_token',
                ],
                'triggers' => [
                    'order_created' => [
                        'name' => 'Order Created',
                        'description' => 'Triggered when a new order is created',
                        'webhook_events' => ['orders/create'],
                        'output_schema' => [
                            'order_id' => ['type' => 'string'],
                            'customer_email' => ['type' => 'string'],
                            'total_amount' => ['type' => 'number'],
                            'created_at' => ['type' => 'datetime'],
                        ],
                    ],
                ],
                'actions' => [
                    'create_customer' => [
                        'name' => 'Create Customer',
                        'description' => 'Create a new customer',
                        'input_schema' => [
                            'email' => ['type' => 'string', 'required' => true],
                            'first_name' => ['type' => 'string', 'required' => false],
                        ],
                        'output_schema' => [
                            'customer_id' => ['type' => 'string'],
                            'created_at' => ['type' => 'datetime'],
                        ],
                    ],
                ],
                'webhook_config' => [
                    'supported' => true,
                    'events' => ['orders/create', 'customers/create'],
                ],
                'rate_limits' => [
                    'requests_per_minute' => 40,
                    'requests_per_hour' => 1000,
                ],
                'documentation_url' => 'https://shopify.dev/docs/admin-api',
                'developer_name' => 'Shopify',
                'developer_url' => 'https://shopify.com',
            ]
        );

        $apps['shopify'] = $shopify;

        // Kajabi App
        $kajabi = App::updateOrCreate(
            ['key' => 'kajabi'],
            [
                'name' => 'Kajabi',
                'description' => 'Online course and membership platform integration',
                'icon_url' => '/icons/kajabi.svg',
                'color' => '#1890ff',
                'category' => 'education',
                'version' => '2.0.0',
                'is_active' => true,
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'oauth2',
                    'auth_url' => 'https://app.kajabi.com/oauth/authorize',
                    'token_url' => 'https://app.kajabi.com/oauth/token',
                    'scopes' => ['read', 'write'],
                    'credentials_schema' => [
                        'client_id' => [
                            'type' => 'string',
                            'label' => 'Client ID',
                            'required' => true,
                            'description' => 'Your Kajabi application client ID'
                        ],
                        'client_secret' => [
                            'type' => 'password',
                            'label' => 'Client Secret',
                            'required' => true,
                            'description' => 'Your Kajabi application client secret'
                        ],
                        'subdomain' => [
                            'type' => 'string',
                            'label' => 'Subdomain',
                            'required' => true,
                            'description' => 'Your Kajabi site subdomain (e.g., "mysite" for mysite.kajabi.com)',
                            'placeholder' => 'mysite'
                        ]
                    ]
                ],
                'triggers' => [
                    'new_order' => [
                        'name' => 'New Order',
                        'description' => 'Triggered when a new order is created (before payment)',
                        'webhook_events' => ['order.created'],
                        'output_schema' => [
                            'order_id' => ['type' => 'string', 'description' => 'Unique order identifier'],
                            'member_id' => ['type' => 'string', 'description' => 'Member who placed the order'],
                            'member_email' => ['type' => 'string', 'description' => 'Member email address'],
                            'member_name' => ['type' => 'string', 'description' => 'Member full name'],
                            'product_id' => ['type' => 'string', 'description' => 'Product being ordered'],
                            'product_name' => ['type' => 'string', 'description' => 'Product name'],
                            'product_type' => ['type' => 'string', 'description' => 'Type of product (course, coaching, etc.)'],
                            'amount' => ['type' => 'number', 'description' => 'Order amount in cents'],
                            'currency' => ['type' => 'string', 'description' => 'Currency code (USD, EUR, etc.)'],
                            'created_at' => ['type' => 'datetime', 'description' => 'When the order was created'],
                        ],
                    ],
                    'order_completed' => [
                        'name' => 'Order Completed',
                        'description' => 'Triggered when payment is completed successfully',
                        'webhook_events' => ['order.completed'],
                        'output_schema' => [
                            'order_id' => ['type' => 'string'],
                            'member_id' => ['type' => 'string'],
                            'member_email' => ['type' => 'string'],
                            'amount_paid' => ['type' => 'number'],
                            'completed_at' => ['type' => 'datetime'],
                        ],
                    ],
                ],
                'actions' => [
                    'create_tag' => [
                        'name' => 'Create Tag',
                        'description' => 'Create a new tag for organizing members',
                        'input_schema' => [
                            'name' => ['type' => 'string', 'required' => true, 'label' => 'Tag Name'],
                            'color' => ['type' => 'string', 'required' => false, 'label' => 'Tag Color', 'default' => '#3B82F6'],
                            'description' => ['type' => 'string', 'required' => false, 'label' => 'Description'],
                        ],
                        'output_schema' => [
                            'tag_id' => ['type' => 'string', 'description' => 'Unique identifier for the created tag'],
                            'name' => ['type' => 'string', 'description' => 'Name of the tag'],
                            'color' => ['type' => 'string', 'description' => 'Color of the tag'],
                            'created_at' => ['type' => 'datetime', 'description' => 'When the tag was created'],
                        ],
                    ],
                    'add_member_tag' => [
                        'name' => 'Add Tag to Member',
                        'description' => 'Add a tag to an existing member',
                        'input_schema' => [
                            'member_email' => ['type' => 'string', 'required' => true, 'label' => 'Member Email'],
                            'tag_name' => ['type' => 'string', 'required' => true, 'label' => 'Tag Name'],
                        ],
                        'output_schema' => [
                            'member_id' => ['type' => 'string'],
                            'tag_id' => ['type' => 'string'],
                            'tagged_at' => ['type' => 'datetime'],
                        ],
                    ],
                ],
                'webhook_config' => [
                    'supported' => true,
                    'authentication' => [
                        'type' => 'signature',
                        'header' => 'X-Kajabi-Signature',
                        'algorithm' => 'sha256',
                    ],
                    'events' => ['order.created', 'order.completed', 'member.created'],
                ],
                'rate_limits' => [
                    'requests_per_minute' => 100,
                    'requests_per_hour' => 1000,
                ],
                'documentation_url' => 'https://developers.kajabi.com',
                'developer_name' => 'Kajabi',
                'developer_url' => 'https://kajabi.com',
            ]
        );

        $apps['kajabi'] = $kajabi;

        // Slack App
        $slack = App::updateOrCreate(
            ['key' => 'slack'],
            [
                'name' => 'Slack',
                'description' => 'Team communication platform',
                'icon_url' => '/icons/slack.svg',
                'color' => '#4a154b',
                'category' => 'communication',
                'version' => '2.0.0',
                'is_active' => true,
                'is_built_in' => true,
                'auth_config' => [
                    'type' => 'oauth2',
                    'auth_url' => 'https://slack.com/oauth/v2/authorize',
                    'token_url' => 'https://slack.com/api/oauth.v2.access',
                ],
                'actions' => [
                    'send_message' => [
                        'name' => 'Send Message',
                        'description' => 'Send a message to a channel',
                        'input_schema' => [
                            'channel' => ['type' => 'string', 'required' => true],
                            'message' => ['type' => 'string', 'required' => true],
                        ],
                        'output_schema' => [
                            'message_id' => ['type' => 'string'],
                            'sent_at' => ['type' => 'datetime'],
                        ],
                    ],
                ],
                'documentation_url' => 'https://api.slack.com',
                'developer_name' => 'Slack',
                'developer_url' => 'https://slack.com',
            ]
        );

        $apps['slack'] = $slack;

        // Webhook App
        $webhook = App::updateOrCreate(
            ['key' => 'webhook'],
            [
                'name' => 'Webhook',
                'description' => 'Receive data from any HTTP POST request',
                'icon_url' => '/icons/webhook.svg',
                'color' => '#6366f1',
                'category' => 'utility',
                'version' => '1.0.0',
                'is_active' => true,
                'is_built_in' => true,
                'triggers' => [
                    'webhook_received' => [
                        'name' => 'Webhook Received',
                        'description' => 'Triggered when data is posted to webhook URL',
                        'webhook_events' => ['webhook.received'],
                        'output_schema' => [
                            'body' => ['type' => 'object'],
                            'headers' => ['type' => 'object'],
                            'timestamp' => ['type' => 'datetime'],
                        ],
                    ],
                ],
                'webhook_config' => [
                    'supported' => true,
                    'generates_url' => true,
                    'events' => ['webhook.received'],
                ],
                'documentation_url' => 'https://docs.numi.com/webhooks',
                'developer_name' => 'Numi',
                'developer_url' => 'https://numi.com',
            ]
        );

        $apps['webhook'] = $webhook;

        return $apps;
    }

    private function createIntegrations(Organization $demoOrg, array $apps): array
    {
        // For now, return empty array since Integration model doesn't exist yet
        // This will be implemented when Integration model is created
        return [];
    }

    private function createAutomationSequences(Organization $demoOrg, User $adminUser, array $integrations): void
    {
        // Customer Welcome Sequence
        $welcomeSequence = Sequence::updateOrCreate(
            [
                'organization_id' => $demoOrg->id,
                'name' => 'Customer Welcome Series',
            ],
            [
                'description' => 'Welcome new customers and notify team',
                'is_active' => true,
                'created_by' => $adminUser->id,
                'metadata' => [
                    'category' => 'customer_onboarding',
                ],
            ]
        );

        // Order Processing Sequence
        $orderSequence = Sequence::updateOrCreate(
            [
                'organization_id' => $demoOrg->id,
                'name' => 'High Value Order Processing',
            ],
            [
                'description' => 'Process high-value orders',
                'is_active' => true,
                'created_by' => $adminUser->id,
                'metadata' => [
                    'category' => 'order_processing',
                ],
            ]
        );
    }
}
