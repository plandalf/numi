<?php

namespace App\Modules\Integrations;

use App\Models\Integration;
use App\Modules\Integrations\Contracts\AutomationTriggers;
use App\Modules\Integrations\Contracts\AutomationActions;
use App\Modules\Integrations\Contracts\AutomationAuth;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Kajabi implements AutomationTriggers, AutomationActions, AutomationAuth
{
    private string $clientId;
    private string $clientSecret;
    private string $subdomain;
    private string $baseUrl;

    public function __construct(string $clientId, string $clientSecret, string $subdomain)
    {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->subdomain = $subdomain;
        $this->baseUrl = "https://{$subdomain}.kajabi.com/api/v1";
    }

    /**
     * Create instance from Integration model
     */
    public static function fromIntegration(Integration $integration): self
    {
        $config = $integration->config ?? [];
        
        if (!isset($config['client_id'], $config['client_secret'], $config['subdomain'])) {
            throw new Exception('Kajabi credentials not properly configured');
        }

        return new self(
            $config['client_id'],
            $config['client_secret'],
            $config['subdomain']
        );
    }

    // ==================== AutomationAuth Implementation ====================

    public function auth(): array
    {
        return [
            'type' => 'client_credentials',
            'method' => 'http_basic',
            'username_field' => 'client_id',
            'password_field' => 'client_secret',
            'additional_fields' => ['subdomain'],
        ];
    }

    public function getCredentialFields(): array
    {
        return [
            [
                'key' => 'client_id',
                'label' => 'Client ID',
                'type' => 'string',
                'required' => true,
                'placeholder' => 'kaj_live_xxxxxxxxxx',
                'description' => 'Your Kajabi Client ID from Settings > Integrations',
                'max_length' => 255,
            ],
            [
                'key' => 'client_secret',
                'label' => 'Client Secret',
                'type' => 'password',
                'required' => true,
                'placeholder' => '••••••••••••••••',
                'description' => 'Your Kajabi Client Secret (keep this secure)',
                'max_length' => 255,
                'sensitive' => true,
            ],
            [
                'key' => 'subdomain',
                'label' => 'Subdomain',
                'type' => 'string',
                'required' => true,
                'placeholder' => 'mysite',
                'description' => 'Your Kajabi site subdomain (without .kajabi.com)',
                'max_length' => 100,
                'validation' => 'regex:/^[a-z0-9-]+$/i',
            ],
        ];
    }

    public function validateCredentials(array $credentials): array
    {
        $errors = [];

        if (empty($credentials['client_id'])) {
            $errors['client_id'] = 'Client ID is required';
        }

        if (empty($credentials['client_secret'])) {
            $errors['client_secret'] = 'Client Secret is required';
        }

        if (empty($credentials['subdomain'])) {
            $errors['subdomain'] = 'Subdomain is required';
        } else {
            $subdomainValidation = $this->validateSubdomain($credentials['subdomain']);
            if (!$subdomainValidation['valid']) {
                $errors['subdomain'] = $subdomainValidation['error'];
            }
        }

        return $errors;
    }

    public function processCredentials(array $credentials): array
    {
        // Clean subdomain (remove .kajabi.com if included)
        if (isset($credentials['subdomain'])) {
            $subdomain = strtolower(trim($credentials['subdomain']));
            $subdomain = str_replace('.kajabi.com', '', $subdomain);
            $credentials['subdomain'] = $subdomain;
        }

        return $credentials;
    }

    public function testConnection(Integration $integration): array
    {
        try {
            $response = $this->makeRequest('GET', '/sites/current');
            
            if ($response['success']) {
                return [
                    'success' => true,
                    'message' => 'Connection successful',
                    'data' => $response['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Connection failed: ' . ($response['error'] ?? 'Unknown error')
            ];
        } catch (Exception $e) {
            Log::error('Kajabi connection test failed', [
                'subdomain' => $this->subdomain,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => $this->translateConnectionError($e->getMessage())
            ];
        }
    }

    public function getAuthType(): string
    {
        return 'client_credentials';
    }

    public function getAuthHelp(): array
    {
        return [
            'documentation_url' => 'https://help.kajabi.com/hc/en-us/articles/360037441834',
            'setup_guide_url' => 'https://help.kajabi.com/hc/en-us/sections/360000579294-Integrations',
            'support_email' => 'support@kajabi.com',
            'video_tutorial_url' => 'https://www.kajabi.com/integrations-tutorial',
        ];
    }

    // ==================== AutomationTriggers Implementation ====================

    public function triggers(): array
    {
        return [
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
                    'payment_method' => ['type' => 'string', 'description' => 'Payment method used'],
                    'coupon_code' => ['type' => 'string', 'description' => 'Coupon code used (if any)'],
                    'discount_amount' => ['type' => 'number', 'description' => 'Discount amount in cents'],
                    'created_at' => ['type' => 'datetime', 'description' => 'When the order was created'],
                    'order_items' => [
                        'type' => 'array',
                        'description' => 'Line items in the order',
                        'items' => [
                            'product_id' => ['type' => 'string'],
                            'product_name' => ['type' => 'string'],
                            'quantity' => ['type' => 'integer'],
                            'price' => ['type' => 'number'],
                        ],
                    ],
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
                    'product_id' => ['type' => 'string'],
                    'amount_paid' => ['type' => 'number'],
                    'payment_method' => ['type' => 'string'],
                    'completed_at' => ['type' => 'datetime'],
                ],
            ],
            'member_created' => [
                'name' => 'Member Created',
                'description' => 'Triggered when a new member is created',
                'webhook_events' => ['member.created'],
                'output_schema' => [
                    'member_id' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                    'first_name' => ['type' => 'string'],
                    'last_name' => ['type' => 'string'],
                    'created_at' => ['type' => 'datetime'],
                ],
            ],
        ];
    }

    public function getTrigger(string $triggerKey): ?array
    {
        return $this->triggers()[$triggerKey] ?? null;
    }

    public function getWebhookEvents(): array
    {
        return [
            'order.created' => 'new_order',
            'order.completed' => 'order_completed',
            'member.created' => 'member_created',
            'member.updated' => 'member_updated',
            'purchase.completed' => 'order_completed',
            'course.completed' => 'course_completed',
            'assessment.completed' => 'assessment_completed',
        ];
    }

    public function handleWebhook(string $triggerKey, array $payload): array
    {
        // Process webhook payload based on trigger type
        switch ($triggerKey) {
            case 'new_order':
                return $this->processOrderWebhook($payload);
            case 'order_completed':
                return $this->processOrderCompletedWebhook($payload);
            case 'member_created':
                return $this->processMemberCreatedWebhook($payload);
            default:
                throw new Exception("Unknown trigger key: {$triggerKey}");
        }
    }

    /**
     * Test if a trigger is properly configured
     */
    public function validateTrigger(string $triggerKey, array $configuration = []): array
    {
        $trigger = $this->getTrigger($triggerKey);
        
        if (!$trigger) {
            return [
                'valid' => false,
                'error' => "Unknown trigger: {$triggerKey}"
            ];
        }

        // Test connection to ensure credentials work
        try {
            $connectionTest = $this->testConnection(new Integration(['config' => [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'subdomain' => $this->subdomain
            ]]));

            if (!$connectionTest['success']) {
                return [
                    'valid' => false,
                    'error' => 'Connection failed: ' . $connectionTest['message']
                ];
            }

            return [
                'valid' => true,
                'message' => 'Trigger is properly configured'
            ];
        } catch (Exception $e) {
            return [
                'valid' => false,
                'error' => 'Validation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Test a trigger by fetching real data from Kajabi
     */
    public function testTrigger(string $triggerKey, array $configuration = []): array
    {
        try {
            switch ($triggerKey) {
                case 'new_order':
                    return $this->testNewOrderTrigger();
                case 'order_completed':
                    return $this->testOrderCompletedTrigger();
                case 'member_created':
                    return $this->testMemberCreatedTrigger();
                default:
                    throw new Exception("Unknown trigger: {$triggerKey}");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Trigger test failed: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Test new_order trigger by fetching recent orders
     */
    private function testNewOrderTrigger(): array
    {
        try {
            // Fetch recent orders from Kajabi
            $response = $this->makeRequest('GET', '/orders', [
                'limit' => 5,
                'sort' => '-created_at'
            ]);

            if (!$response['success']) {
                throw new Exception($response['error'] ?? 'Failed to fetch orders');
            }

            $orders = $response['data']['orders'] ?? [];
            
            if (empty($orders)) {
                return [
                    'success' => false,
                    'message' => 'No orders found in your Kajabi account',
                    'suggestion' => 'Create a test order in Kajabi to test this trigger'
                ];
            }

            // Use the most recent order as test data
            $latestOrder = $orders[0];
            
            // Process the order data to match trigger output schema
            $testData = $this->processOrderWebhook($latestOrder);

            return [
                'success' => true,
                'message' => 'Found recent order for testing',
                'data' => $testData,
                'source' => [
                    'order_id' => $latestOrder['id'] ?? 'unknown',
                    'fetched_at' => now()->toISOString(),
                    'total_orders_found' => count($orders)
                ]
            ];
        } catch (Exception $e) {
            throw new Exception("Failed to test new_order trigger: " . $e->getMessage());
        }
    }

    /**
     * Test order_completed trigger by fetching completed orders
     */
    private function testOrderCompletedTrigger(): array
    {
        try {
            // Fetch recent completed orders from Kajabi
            $response = $this->makeRequest('GET', '/orders', [
                'limit' => 5,
                'sort' => '-completed_at',
                'status' => 'completed'
            ]);

            if (!$response['success']) {
                throw new Exception($response['error'] ?? 'Failed to fetch completed orders');
            }

            $orders = $response['data']['orders'] ?? [];
            
            if (empty($orders)) {
                return [
                    'success' => false,
                    'message' => 'No completed orders found in your Kajabi account',
                    'suggestion' => 'Complete a test order in Kajabi to test this trigger'
                ];
            }

            // Use the most recent completed order as test data
            $latestOrder = $orders[0];
            
            // Process the order data to match trigger output schema
            $testData = $this->processOrderCompletedWebhook($latestOrder);

            return [
                'success' => true,
                'message' => 'Found recent completed order for testing',
                'data' => $testData,
                'source' => [
                    'order_id' => $latestOrder['id'] ?? 'unknown',
                    'fetched_at' => now()->toISOString(),
                    'total_completed_orders_found' => count($orders)
                ]
            ];
        } catch (Exception $e) {
            throw new Exception("Failed to test order_completed trigger: " . $e->getMessage());
        }
    }

    /**
     * Test member_created trigger by fetching recent members
     */
    private function testMemberCreatedTrigger(): array
    {
        try {
            // Fetch recent members from Kajabi
            $response = $this->makeRequest('GET', '/members', [
                'limit' => 5,
                'sort' => '-created_at'
            ]);

            if (!$response['success']) {
                throw new Exception($response['error'] ?? 'Failed to fetch members');
            }

            $members = $response['data']['members'] ?? [];
            
            if (empty($members)) {
                return [
                    'success' => false,
                    'message' => 'No members found in your Kajabi account',
                    'suggestion' => 'Create a test member in Kajabi to test this trigger'
                ];
            }

            // Use the most recent member as test data
            $latestMember = $members[0];
            
            // Process the member data to match trigger output schema
            $testData = $this->processMemberCreatedWebhook($latestMember);

            return [
                'success' => true,
                'message' => 'Found recent member for testing',
                'data' => $testData,
                'source' => [
                    'member_id' => $latestMember['id'] ?? 'unknown',
                    'fetched_at' => now()->toISOString(),
                    'total_members_found' => count($members)
                ]
            ];
        } catch (Exception $e) {
            throw new Exception("Failed to test member_created trigger: " . $e->getMessage());
        }
    }

    // ==================== AutomationActions Implementation ====================

    public function actions(): array
    {
        return [
            'create_tag' => [
                'name' => 'Create Tag',
                'description' => 'Create a new tag for organizing members',
                'input_schema' => [
                    'name' => [
                        'type' => 'string',
                        'required' => true,
                        'label' => 'Tag Name',
                        'description' => 'Name of the tag to create',
                        'max_length' => 100,
                    ],
                    'color' => [
                        'type' => 'string',
                        'required' => false,
                        'label' => 'Tag Color',
                        'description' => 'Hex color code for the tag',
                        'default' => '#3B82F6',
                        'pattern' => '^#[0-9A-Fa-f]{6}$',
                    ],
                    'description' => [
                        'type' => 'string',
                        'required' => false,
                        'label' => 'Description',
                        'description' => 'Optional description for the tag',
                        'max_length' => 255,
                    ],
                ],
                'output_schema' => [
                    'tag_id' => ['type' => 'string', 'description' => 'Unique identifier for the created tag'],
                    'name' => ['type' => 'string', 'description' => 'Name of the tag'],
                    'color' => ['type' => 'string', 'description' => 'Color of the tag'],
                    'description' => ['type' => 'string', 'description' => 'Description of the tag'],
                    'created_at' => ['type' => 'datetime', 'description' => 'When the tag was created'],
                    'member_count' => ['type' => 'integer', 'description' => 'Number of members with this tag'],
                ],
            ],
            'add_member_tag' => [
                'name' => 'Add Tag to Member',
                'description' => 'Add a tag to an existing member',
                'input_schema' => [
                    'member_email' => [
                        'type' => 'string',
                        'required' => true,
                        'label' => 'Member Email',
                        'description' => 'Email address of the member',
                        'format' => 'email',
                    ],
                    'tag_name' => [
                        'type' => 'string',
                        'required' => true,
                        'label' => 'Tag Name',
                        'description' => 'Name of the tag to add',
                    ],
                ],
                'output_schema' => [
                    'member_id' => ['type' => 'string', 'description' => 'Member ID'],
                    'tag_id' => ['type' => 'string', 'description' => 'Tag ID'],
                    'tagged_at' => ['type' => 'datetime', 'description' => 'When the tag was added'],
                    'member_name' => ['type' => 'string', 'description' => 'Member full name'],
                    'total_tags' => ['type' => 'integer', 'description' => 'Total number of tags on member'],
                ],
            ],
            'create_member' => [
                'name' => 'Create Member',
                'description' => 'Create a new member in Kajabi',
                'input_schema' => [
                    'email' => ['type' => 'string', 'required' => true, 'format' => 'email'],
                    'first_name' => ['type' => 'string', 'required' => false],
                    'last_name' => ['type' => 'string', 'required' => false],
                    'phone' => ['type' => 'string', 'required' => false],
                    'tags' => ['type' => 'array', 'items' => 'string', 'required' => false],
                ],
                'output_schema' => [
                    'member_id' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                    'full_name' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                    'created_at' => ['type' => 'datetime'],
                ],
            ],
        ];
    }

    public function getAction(string $actionKey): ?array
    {
        return $this->actions()[$actionKey] ?? null;
    }

    public function executeAction(string $actionKey, array $input): array
    {
        switch ($actionKey) {
            case 'create_tag':
                return $this->createTag($input['name'], $input);
            case 'add_member_tag':
                return $this->addTagToMember($input['member_email'], $input['tag_name']);
            case 'create_member':
                return $this->createMember($input);
            default:
                throw new Exception("Unknown action: {$actionKey}");
        }
    }

    public function testAction(string $actionKey, array $input): array
    {
        // Return mock data for testing
        switch ($actionKey) {
            case 'create_tag':
                return [
                    'tag_id' => 'tag_mock_' . uniqid(),
                    'name' => $input['name'],
                    'color' => $input['color'] ?? '#3B82F6',
                    'description' => $input['description'] ?? null,
                    'created_at' => now()->toISOString(),
                    'member_count' => 0,
                ];
            case 'add_member_tag':
                return [
                    'member_id' => 'member_mock_' . uniqid(),
                    'tag_id' => 'tag_mock_' . uniqid(),
                    'tagged_at' => now()->toISOString(),
                    'member_name' => 'Test User',
                    'total_tags' => 1,
                ];
            case 'create_member':
                return [
                    'member_id' => 'member_mock_' . uniqid(),
                    'email' => $input['email'],
                    'full_name' => ($input['first_name'] ?? '') . ' ' . ($input['last_name'] ?? ''),
                    'status' => 'active',
                    'created_at' => now()->toISOString(),
                ];
            default:
                throw new Exception("Unknown action for testing: {$actionKey}");
        }
    }

    public function validateAction(string $actionKey, array $input): array
    {
        $action = $this->getAction($actionKey);
        
        if (!$action) {
            return [
                'valid' => false,
                'errors' => ["Unknown action: {$actionKey}"]
            ];
        }

        $errors = [];
        $inputSchema = $action['input_schema'] ?? [];

        foreach ($inputSchema as $field => $schema) {
            if ($schema['required'] && empty($input[$field])) {
                $errors[] = "Field '{$field}' is required";
            }

            if (isset($input[$field]) && $schema['type'] === 'email') {
                if (!filter_var($input[$field], FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "Field '{$field}' must be a valid email address";
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    // ==================== API Methods ====================

    /**
     * Create a tag
     */
    public function createTag(string $name, array $options = []): array
    {
        $data = array_merge(['name' => $name], $options);
        return $this->makeRequest('POST', '/tags', $data);
    }

    /**
     * Add tag to member
     */
    public function addTagToMember(string $memberEmail, string $tagName): array
    {
        // First find the member
        $membersResponse = $this->makeRequest('GET', '/members', ['email' => $memberEmail]);
        
        if (!$membersResponse['success'] || empty($membersResponse['data']['members'])) {
            return [
                'success' => false,
                'error' => 'Member not found'
            ];
        }

        $member = $membersResponse['data']['members'][0];
        
        // Add tag to member
        return $this->makeRequest('POST', "/members/{$member['id']}/tags", [
            'tag_name' => $tagName
        ]);
    }

    /**
     * Create a member
     */
    public function createMember(array $memberData): array
    {
        return $this->makeRequest('POST', '/members', $memberData);
    }

    /**
     * Get site information
     */
    public function getSiteInfo(): array
    {
        return $this->makeRequest('GET', '/sites/current');
    }

    /**
     * Get orders
     */
    public function getOrders(array $params = []): array
    {
        return $this->makeRequest('GET', '/orders', $params);
    }

    /**
     * Get members
     */
    public function getMembers(array $params = []): array
    {
        return $this->makeRequest('GET', '/members', $params);
    }

    // ==================== Private Methods ====================

    /**
     * Make an authenticated request to Kajabi API
     */
    private function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        try {
            $url = $this->baseUrl . $endpoint;

            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->timeout(30);

            if ($method === 'GET') {
                $response = $response->get($url, $data);
            } elseif ($method === 'POST') {
                $response = $response->post($url, $data);
            } elseif ($method === 'PUT') {
                $response = $response->put($url, $data);
            } elseif ($method === 'DELETE') {
                $response = $response->delete($url, $data);
            } else {
                throw new Exception("Unsupported HTTP method: {$method}");
            }

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                    'status' => $response->status()
                ];
            }

            Log::warning('Kajabi API error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'url' => $url,
                'method' => $method
            ]);

            return [
                'success' => false,
                'error' => $response->json()['message'] ?? 'API request failed',
                'status' => $response->status(),
                'data' => $response->json()
            ];

        } catch (Exception $e) {
            Log::error('Kajabi API request exception', [
                'error' => $e->getMessage(),
                'url' => $url ?? null,
                'method' => $method
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate subdomain format
     */
    private function validateSubdomain(string $subdomain): array
    {
        $subdomain = strtolower(trim($subdomain));
        
        // Remove .kajabi.com if user included it
        $subdomain = str_replace('.kajabi.com', '', $subdomain);
        
        // Check if it's just a number
        if (is_numeric($subdomain)) {
            return [
                'valid' => false,
                'error' => 'Subdomain cannot be just a number',
                'suggestion' => 'Use your actual Kajabi site subdomain (e.g., "mycompany")',
            ];
        }
        
        // Check minimum length
        if (strlen($subdomain) < 3) {
            return [
                'valid' => false,
                'error' => 'Subdomain must be at least 3 characters long',
                'suggestion' => 'Use your full Kajabi site subdomain',
            ];
        }
        
        // Check for invalid characters
        if (!preg_match('/^[a-z0-9-]+$/', $subdomain)) {
            return [
                'valid' => false,
                'error' => 'Subdomain can only contain letters, numbers, and hyphens',
                'suggestion' => 'Remove any special characters except hyphens',
            ];
        }
        
        return [
            'valid' => true,
            'subdomain' => $subdomain,
        ];
    }

    /**
     * Translate technical errors to user-friendly messages
     */
    private function translateConnectionError(string $error): string
    {
        $errorLower = strtolower($error);
        
        if (str_contains($errorLower, 'could not resolve host')) {
            $subdomain = $this->extractSubdomainFromError($error);
            return "❌ Invalid subdomain '{$subdomain}'. Please check your Kajabi site URL and enter the correct subdomain.";
        }
        
        if (str_contains($errorLower, 'unauthorized') || str_contains($errorLower, '401')) {
            return "❌ Invalid credentials. Please check your Client ID and Client Secret.";
        }
        
        if (str_contains($errorLower, 'forbidden') || str_contains($errorLower, '403')) {
            return "❌ Access denied. Please ensure your API credentials have the necessary permissions.";
        }
        
        if (str_contains($errorLower, 'timeout')) {
            return "❌ Connection timeout. Please check your internet connection and try again.";
        }
        
        return "❌ Connection failed: " . $error;
    }

    /**
     * Extract subdomain from error message
     */
    private function extractSubdomainFromError(string $error): string
    {
        if (preg_match('/could not resolve host: ([^.]+)\.kajabi\.com/i', $error, $matches)) {
            return $matches[1];
        }
        
        return 'unknown';
    }

    /**
     * Process webhook payloads for different trigger types
     */
    private function processOrderWebhook(array $payload): array
    {
        // Process and normalize Kajabi order webhook payload
        return [
            'order_id' => $payload['id'] ?? null,
            'member_id' => $payload['member_id'] ?? null,
            'member_email' => $payload['member']['email'] ?? null,
            'member_name' => $payload['member']['name'] ?? null,
            'product_id' => $payload['product_id'] ?? null,
            'product_name' => $payload['product']['name'] ?? null,
            'amount' => $payload['amount'] ?? null,
            'currency' => $payload['currency'] ?? 'USD',
            'created_at' => $payload['created_at'] ?? now()->toISOString(),
        ];
    }

    private function processOrderCompletedWebhook(array $payload): array
    {
        return [
            'order_id' => $payload['id'] ?? null,
            'member_id' => $payload['member_id'] ?? null,
            'member_email' => $payload['member']['email'] ?? null,
            'amount_paid' => $payload['amount_paid'] ?? null,
            'completed_at' => $payload['completed_at'] ?? now()->toISOString(),
        ];
    }

    private function processMemberCreatedWebhook(array $payload): array
    {
        return [
            'member_id' => $payload['id'] ?? null,
            'email' => $payload['email'] ?? null,
            'first_name' => $payload['first_name'] ?? null,
            'last_name' => $payload['last_name'] ?? null,
            'created_at' => $payload['created_at'] ?? now()->toISOString(),
        ];
    }
} 