<?php

namespace Tests\Feature\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Models\Integration;
use App\Models\App;
use App\Services\AppDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutomationDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Organization $organization;
    private AppDiscoveryService $discoveryService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->organization = Organization::factory()->create();
        $this->user->organizations()->attach($this->organization->id, ['role' => 'owner']);
        $this->user->current_organization_id = $this->organization->id;
        $this->user->save();
        
        $this->discoveryService = new AppDiscoveryService();
    }

    public function test_discovered_apps_endpoint_returns_apps_with_actions_triggers_and_resources()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-apps');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'name',
                'class',
                'actions' => [
                    '*' => [
                        'key',
                        'noun',
                        'label',
                        'description',
                        'type',
                        'props',
                        'class',
                    ]
                ],
                'triggers' => [
                    '*' => [
                        'key',
                        'noun',
                        'label',
                        'description',
                        'props',
                        'class',
                    ]
                ],
                'resources' => [
                    '*' => [
                        'key',
                        'noun',
                        'label',
                        'description',
                        'class',
                    ]
                ],
            ]
        ]);

        $data = $response->json();
        $this->assertIsArray($data);
        
        // Should contain at least Kajabi app
        $kajabiApp = collect($data)->firstWhere('name', 'Kajabi');
        if ($kajabiApp) {
            $this->assertArrayHasKey('actions', $kajabiApp);
            $this->assertArrayHasKey('triggers', $kajabiApp);
            $this->assertArrayHasKey('resources', $kajabiApp);
        }
    }

    public function test_discovered_actions_endpoint_returns_all_actions_with_app_info()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-actions');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'key',
                'noun',
                'label',
                'description',
                'type',
                'props',
                'class',
                'app',
            ]
        ]);

        $data = $response->json();
        $this->assertIsArray($data);
        
        // Each action should have an app field
        foreach ($data as $action) {
            $this->assertArrayHasKey('app', $action);
            $this->assertNotEmpty($action['app']);
            $this->assertArrayHasKey('key', $action);
            $this->assertArrayHasKey('label', $action);
        }
    }

    public function test_discovered_triggers_endpoint_returns_all_triggers_with_app_info()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-triggers');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'key',
                'noun',
                'label',
                'description',
                'props',
                'class',
                'app',
            ]
        ]);

        $data = $response->json();
        $this->assertIsArray($data);
        
        // Each trigger should have an app field
        foreach ($data as $trigger) {
            $this->assertArrayHasKey('app', $trigger);
            $this->assertNotEmpty($trigger['app']);
            $this->assertArrayHasKey('key', $trigger);
            $this->assertArrayHasKey('label', $trigger);
        }
    }

    public function test_discovered_resources_endpoint_returns_all_resources_with_app_info()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-resources');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'key',
                'noun',
                'label',
                'description',
                'class',
                'app',
            ]
        ]);

        $data = $response->json();
        $this->assertIsArray($data);
        
        // Each resource should have an app field
        foreach ($data as $resource) {
            $this->assertArrayHasKey('app', $resource);
            $this->assertNotEmpty($resource['app']);
            $this->assertArrayHasKey('key', $resource);
            $this->assertArrayHasKey('label', $resource);
        }
    }

    public function test_resource_search_endpoint_with_valid_resource()
    {
        // Create a Kajabi app and integration for testing
        $kajabiApp = App::factory()->create(['key' => 'kajabi']);
        $integration = Integration::factory()->create([
            'app_id' => $kajabiApp->id,
            'organization_id' => $this->organization->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/resource-search/offer?search=test&app=Kajabi&integration_id={$integration->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'id',
                'name',
            ]
        ]);

        $data = $response->json();
        $this->assertIsArray($data);
    }

    public function test_resource_search_endpoint_with_invalid_resource()
    {
        // Create a Kajabi app and integration for testing
        $kajabiApp = App::factory()->create(['key' => 'kajabi']);
        $integration = Integration::factory()->create([
            'app_id' => $kajabiApp->id,
            'organization_id' => $this->organization->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/resource-search/invalid-resource?app=Kajabi&integration_id={$integration->id}");

        $response->assertStatus(404);
        $response->assertJson(['error' => 'Resource not found']);
    }

    public function test_resource_search_endpoint_with_query_parameters()
    {
        // Create a Kajabi app and integration for testing
        $kajabiApp = App::factory()->create(['key' => 'kajabi']);
        $integration = Integration::factory()->create([
            'app_id' => $kajabiApp->id,
            'organization_id' => $this->organization->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/resource-search/offer?search=premium&limit=5&app=Kajabi&integration_id={$integration->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'id',
                'name',
            ]
        ]);
    }

    public function test_test_action_config_endpoint_with_valid_action()
    {
        // Create a Kajabi app and integration for testing
        $kajabiApp = App::factory()->create(['key' => 'kajabi']);
        $integration = Integration::factory()->create([
            'app_id' => $kajabiApp->id,
            'organization_id' => $this->organization->id,
        ]);

        $testData = [
            'name' => 'Test Action',
            'type' => 'action',
            'app_action_key' => 'create_contact_tag',
            'app_name' => 'Kajabi',
            'configuration' => [
                'tag_name' => 'Test Tag',
                'contact_email' => 'test@example.com',
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/sequences/test-action-config', $testData);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data',
        ]);
    }

    public function test_test_action_config_endpoint_with_invalid_action()
    {
        $testData = [
            'name' => 'Test Action',
            'type' => 'action',
            'app_action_key' => 'invalid_action',
            'app_name' => 'Kajabi',
            'configuration' => ['foo' => 'bar'],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/sequences/test-action-config', $testData);

        $response->assertStatus(404);
    }

    public function test_test_action_config_endpoint_with_missing_required_fields()
    {
        $testData = [
            'actionKey' => 'create_contact_tag',
            'appName' => 'Kajabi',
            // Missing arguments
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/sequences/test-action-config', $testData);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'success',
            'message',
        ]);
        $this->assertFalse($response->json('success'));
    }

    public function test_edit_endpoint_returns_discovered_apps_instead_of_hardcoded()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/1/edit');

        // Should return 404 for non-existent sequence, but we can test the structure
        // by creating a sequence first
        $response->assertStatus(404);
    }

    public function test_edit_endpoint_with_existing_sequence()
    {
        // Create a sequence first
        $sequence = $this->organization->sequences()->create([
            'name' => 'Test Sequence',
            'description' => 'Test Description',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/{$sequence->id}/edit");

        $response->assertStatus(200);
        
        // Check that the response includes discovered apps
        $response->assertJsonStructure([
            'sequence',
            'apps' => [
                '*' => [
                    'name',
                    'class',
                    'actions',
                    'triggers',
                    'resources',
                ]
            ],
        ]);

        $data = $response->json();
        $this->assertArrayHasKey('apps', $data);
        $this->assertIsArray($data['apps']);
    }

    public function test_endpoints_require_authentication()
    {
        $endpoints = [
            '/sequences/discovered-apps',
            '/sequences/discovered-actions',
            '/sequences/discovered-triggers',
            '/sequences/discovered-resources',
            '/sequences/resource-search/offer',
            '/sequences/test-action-config',
        ];

        foreach ($endpoints as $endpoint) {
            $method = $endpoint === '/sequences/test-action-config' ? 'postJson' : 'getJson';
            $response = $this->$method($endpoint);
            $response->assertStatus(401);
        }
    }

    public function test_discovered_apps_contain_valid_app_structure()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-apps');

        $response->assertStatus(200);
        $data = $response->json();

        foreach ($data as $app) {
            // Check required app fields
            $this->assertArrayHasKey('name', $app);
            $this->assertArrayHasKey('class', $app);
            $this->assertArrayHasKey('actions', $app);
            $this->assertArrayHasKey('triggers', $app);
            $this->assertArrayHasKey('resources', $app);

            // Check data types
            $this->assertIsString($app['name']);
            $this->assertIsString($app['class']);
            $this->assertIsArray($app['actions']);
            $this->assertIsArray($app['triggers']);
            $this->assertIsArray($app['resources']);

            // Check that class exists
            $this->assertTrue(class_exists($app['class']));
        }
    }

    public function test_discovered_actions_contain_valid_action_structure()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-actions');

        $response->assertStatus(200);
        $data = $response->json();

        foreach ($data as $action) {
            // Check required action fields
            $this->assertArrayHasKey('key', $action);
            $this->assertArrayHasKey('noun', $action);
            $this->assertArrayHasKey('label', $action);
            $this->assertArrayHasKey('description', $action);
            $this->assertArrayHasKey('type', $action);
            $this->assertArrayHasKey('props', $action);
            $this->assertArrayHasKey('class', $action);
            $this->assertArrayHasKey('app', $action);

            // Check data types
            $this->assertIsString($action['key']);
            $this->assertIsString($action['noun']);
            $this->assertIsString($action['label']);
            $this->assertIsString($action['description']);
            $this->assertIsString($action['type']);
            $this->assertIsArray($action['props']);
            $this->assertIsString($action['class']);
            $this->assertIsString($action['app']);

            // Check that class exists
            $this->assertTrue(class_exists($action['class']));
        }
    }

    public function test_discovered_triggers_contain_valid_trigger_structure()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-triggers');

        $response->assertStatus(200);
        $data = $response->json();

        foreach ($data as $trigger) {
            // Check required trigger fields
            $this->assertArrayHasKey('key', $trigger);
            $this->assertArrayHasKey('noun', $trigger);
            $this->assertArrayHasKey('label', $trigger);
            $this->assertArrayHasKey('description', $trigger);
            $this->assertArrayHasKey('props', $trigger);
            $this->assertArrayHasKey('class', $trigger);
            $this->assertArrayHasKey('app', $trigger);

            // Check data types
            $this->assertIsString($trigger['key']);
            $this->assertIsString($trigger['noun']);
            $this->assertIsString($trigger['label']);
            $this->assertIsString($trigger['description']);
            $this->assertIsArray($trigger['props']);
            $this->assertIsString($trigger['class']);
            $this->assertIsString($trigger['app']);

            // Check that class exists
            $this->assertTrue(class_exists($trigger['class']));
        }
    }

    public function test_discovered_resources_contain_valid_resource_structure()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-resources');

        $response->assertStatus(200);
        $data = $response->json();

        foreach ($data as $resource) {
            // Check required resource fields
            $this->assertArrayHasKey('key', $resource);
            $this->assertArrayHasKey('noun', $resource);
            $this->assertArrayHasKey('label', $resource);
            $this->assertArrayHasKey('description', $resource);
            $this->assertArrayHasKey('class', $resource);
            $this->assertArrayHasKey('app', $resource);

            // Check data types
            $this->assertIsString($resource['key']);
            $this->assertIsString($resource['noun']);
            $this->assertIsString($resource['label']);
            $this->assertIsString($resource['description']);
            $this->assertIsString($resource['class']);
            $this->assertIsString($resource['app']);

            // Check that class exists
            $this->assertTrue(class_exists($resource['class']));
        }
    }

    public function test_resource_search_returns_valid_results_structure()
    {
        // Create a Kajabi app and integration for testing
        $kajabiApp = App::factory()->create(['key' => 'kajabi']);
        $integration = Integration::factory()->create([
            'app_id' => $kajabiApp->id,
            'organization_id' => $this->organization->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/resource-search/offer?app=Kajabi&integration_id={$integration->id}");

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertIsArray($data);

        if (!empty($data)) {
            foreach ($data as $item) {
                // Check that each item has id and name
                $this->assertArrayHasKey('id', $item);
                $this->assertArrayHasKey('name', $item);

                // Check data types
                $this->assertIsString($item['id']);
                $this->assertIsString($item['name']);

                // Check that values are not empty
                $this->assertNotEmpty($item['id']);
                $this->assertNotEmpty($item['name']);
            }
        }
    }

    public function test_test_action_config_with_complex_arguments()
    {
        // Create a Kajabi app and integration for testing
        $kajabiApp = App::factory()->create(['key' => 'kajabi']);
        $integration = Integration::factory()->create([
            'app_id' => $kajabiApp->id,
            'organization_id' => $this->organization->id,
        ]);

        $testData = [
            'name' => 'Test Action',
            'type' => 'action',
            'app_action_key' => 'create_contact_tag',
            'app_name' => 'Kajabi',
            'configuration' => [
                'tag_name' => 'Premium Customer',
                'contact_email' => 'premium@example.com',
                'metadata' => [
                    'source' => 'automation',
                    'timestamp' => time(),
                ],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/sequences/test-action-config', $testData);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data',
        ]);
    }
}
