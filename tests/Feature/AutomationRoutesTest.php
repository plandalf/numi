<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Organization;
use App\Models\Automation\Sequence;
use App\Models\Automation\Trigger;
use App\Models\Automation\Action;
use App\Models\App;
use App\Models\Integration;
use App\Services\AppDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class AutomationRoutesTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected Organization $organization;
    protected App $kajabiApp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->organization = Organization::factory()->create();
        $this->user->organizations()->attach($this->organization->id, ['role' => 'owner']);
        $this->user->update(['current_organization_id' => $this->organization->id]);

        // Create Kajabi app
        $this->kajabiApp = App::factory()->create([
            'key' => 'kajabi',
            'name' => 'Kajabi',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function it_can_get_discovered_apps()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-apps');

        $response->assertStatus(200);

        // Debug: Let's see what's actually returned
        $data = $response->json();

        // Check if we have any apps at all
        $this->assertNotEmpty($data, 'Response should not be empty');

        // Check if we have the expected structure for any app
        $firstApp = array_values($data)[0] ?? null;
        if ($firstApp) {
            $this->assertArrayHasKey('name', $firstApp);
            $this->assertArrayHasKey('class', $firstApp);
            $this->assertArrayHasKey('actions', $firstApp);
            $this->assertArrayHasKey('triggers', $firstApp);
            $this->assertArrayHasKey('resources', $firstApp);
        }
    }

    /** @test */
    public function it_can_get_discovered_actions()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-actions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'kajabi' => [
                    '*' => [
                        'key',
                        'label',
                        'description',
                        'props'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_get_discovered_triggers()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-triggers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'kajabi' => [
                    '*' => [
                        'key',
                        'label',
                        'description',
                        'props'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_get_discovered_resources()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/discovered-resources');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'kajabi' => [
                    '*' => [
                        'key',
                        'label',
                        'description'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_search_resources()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'client_id' => 'kaj_live_test123',
                'client_secret' => 'test_secret_123',
                'subdomain' => 'test'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/sequences/resource-search/offer?app=kajabi&integration_id=' . $integration->id . '&search=test');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_get_discovered_app_actions()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/discovered/apps/kajabi/actions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'actions' => [
                    '*' => [
                        'key',
                        'label',
                        'description',
                        'props'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_app_actions()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/discovered/apps/nonexistent/actions');

        $response->assertStatus(404)
            ->assertJson(['error' => 'App not found']);
    }

    /** @test */
    public function it_can_get_discovered_app_triggers()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/discovered/apps/kajabi/triggers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'triggers' => [
                    '*' => [
                        'key',
                        'label',
                        'description',
                        'props'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_app_triggers()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/discovered/apps/nonexistent/triggers');

        $response->assertStatus(404)
            ->assertJson(['error' => 'App not found']);
    }

    /** @test */
    public function it_can_get_integrations()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/automation-integrations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'integrations' => [
                    '*' => [
                        'id',
                        'uuid',
                        'app_id',
                        'name',
                        'type',
                        'current_state',
                        'created_at',
                        'app' => [
                            'id',
                            'key',
                            'name',
                            'icon_url',
                            'color'
                        ]
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_get_integration_credential_fields()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/automation-integrations/credential-fields/kajabi');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'credential_fields',
                'help_info'
            ]);
    }

    /** @test */
    public function it_returns_error_for_invalid_integration_type()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/automation-integrations/credential-fields/invalid');

        $response->assertStatus(400)
            ->assertJson(['error' => 'Invalid integration type']);
    }

    /** @test */
    public function it_can_store_integration()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/automation-integrations', [
                'app_id' => $this->kajabiApp->id,
                'name' => 'Test Kajabi Integration',
                'credentials' => [
                    'client_id' => 'kaj_live_test123',
                    'client_secret' => 'test_secret_123',
                    'subdomain' => 'test'
                ]
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'integration' => [
                    'id',
                    'uuid',
                    'app_id',
                    'name',
                    'type',
                    'current_state',
                    'app'
                ],
                'test_result',
                'message'
            ]);

        $this->assertDatabaseHas('integrations', [
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'name' => 'Test Kajabi Integration',
            'type' => 'kajabi'
        ]);
    }

    /** @test */
    public function it_validates_integration_credentials()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/automation-integrations', [
                'app_id' => $this->kajabiApp->id,
                'name' => 'Test Kajabi Integration',
                'credentials' => [
                    'client_id' => '', // Invalid empty client_id
                    'client_secret' => 'test_secret_123',
                    'subdomain' => 'test'
                ]
            ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors'
            ]);
    }

    /** @test */
    public function it_can_test_integration()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'client_id' => 'kaj_live_test123',
                'client_secret' => 'test_secret_123',
                'subdomain' => 'test'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/automation-integrations/{$integration->uuid}/test");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message'
            ]);
    }

    /** @test */
    public function it_can_get_integration_triggers()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'client_id' => 'kaj_live_test123',
                'client_secret' => 'test_secret_123',
                'subdomain' => 'test'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/automation-integrations/{$integration->uuid}/triggers");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'triggers'
            ]);
    }

    /** @test */
    public function it_can_get_integration_actions()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'client_id' => 'kaj_live_test123',
                'client_secret' => 'test_secret_123',
                'subdomain' => 'test'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/automation-integrations/{$integration->uuid}/actions");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'actions'
            ]);
    }

    /** @test */
    public function it_can_test_integration_action()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'client_id' => 'kaj_live_test123',
                'client_secret' => 'test_secret_123',
                'subdomain' => 'test'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/automation-integrations/{$integration->uuid}/actions/test", [
                'action_key' => 'create_contact_tag',
                'input' => [
                    'name' => 'Test Tag',
                    'contact' => '12345'
                ]
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'result'
            ]);
    }

    /** @test */
    public function it_can_update_integration()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'client_id' => 'kaj_live_test123',
                'client_secret' => 'test_secret_123',
                'subdomain' => 'test'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/automation-integrations/{$integration->uuid}", [
                'name' => 'Updated Integration Name',
                'credentials' => [
                    'client_id' => 'kaj_live_updated123',
                    'client_secret' => 'updated_secret_123',
                    'subdomain' => 'updated'
                ]
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'integration',
                'message'
            ]);

        $this->assertDatabaseHas('integrations', [
            'id' => $integration->id,
            'name' => 'Updated Integration Name'
        ]);
    }

    /** @test */
    public function it_can_delete_integration()
    {
        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/automation-integrations/{$integration->uuid}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Integration deleted successfully']);

        $this->assertSoftDeleted('integrations', [
            'id' => $integration->id
        ]);
    }

    /** @test */
    public function it_can_create_sequence()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/sequences', [
                'name' => 'Test Sequence',
                'description' => 'Test sequence description'
            ]);

        $response->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('automation_sequences', [
            'organization_id' => $this->organization->id,
            'name' => 'Test Sequence',
            'description' => 'Test sequence description',
            'is_active' => false
        ]);
    }

    /** @test */
    public function it_can_get_sequence_edit_page()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->get("/sequences/{$sequence->id}/edit");

        $response->assertStatus(200);
    }

    /** @test */
    public function it_can_get_sequence_edit_data_as_json()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/{$sequence->id}/edit");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'sequence' => [
                    'id',
                    'name',
                    'description',
                    'is_active',
                    'triggers',
                    'nodes'
                ],
                'apps',
                'integrations'
            ]);
    }

    /** @test */
    public function it_can_store_trigger()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/triggers", [
                'name' => 'Test Trigger',
                'app_id' => $this->kajabiApp->id,
                'integration_id' => $integration->id,
                'trigger_key' => 'new_purchase',
                'configuration' => ['offer_id' => 1],
                'conditions' => [],
                'app_name' => 'kajabi'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'trigger' => [
                    'id',
                    'name',
                    'trigger_key',
                    'configuration',
                    'conditions',
                    'integration'
                ],
                'message'
            ]);

        $this->assertDatabaseHas('automation_triggers', [
            'sequence_id' => $sequence->id,
            'name' => 'Test Trigger',
            'trigger_key' => 'new_purchase'
        ]);
    }

    /** @test */
    public function it_can_update_trigger()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $trigger = Trigger::factory()->create([
            'sequence_id' => $sequence->id,
            'name' => 'Original Name'
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/sequences/{$sequence->id}/triggers/{$trigger->id}", [
                'name' => 'Updated Trigger Name',
                'configuration' => ['offer_id' => 2],
                'is_active' => false
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'trigger',
                'message'
            ]);

        $this->assertDatabaseHas('automation_triggers', [
            'id' => $trigger->id,
            'name' => 'Updated Trigger Name',
            'is_active' => false
        ]);
    }

    /** @test */
    public function it_can_delete_trigger()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $trigger = Trigger::factory()->create([
            'sequence_id' => $sequence->id
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/sequences/{$sequence->id}/triggers/{$trigger->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Trigger deleted successfully']);

        $this->assertDatabaseMissing('automation_triggers', [
            'id' => $trigger->id
        ]);
    }

    /** @test */
    public function it_can_test_trigger()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'subdomain' => 'test',
                'api_key' => 'test_key'
            ]
        ]);

        $trigger = Trigger::factory()->create([
            'sequence_id' => $sequence->id,
            'integration_id' => $integration->id,
            'trigger_key' => 'new-purchase'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/triggers/{$trigger->id}/test");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data'
            ]);
    }

    /** @test */
    public function it_can_store_action()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/actions", [
                'name' => 'Test Action',
                'type' => 'app_action',
                'configuration' => [
                    'tag_name' => 'Test Tag'
                ],
                'position' => ['x' => 100, 'y' => 100],
                'app_action_key' => 'create_contact_tag',
                'app_name' => 'kajabi'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'action' => [
                    'id',
                    'name',
                    'type',
                    'arguments',
                    'position'
                ],
                'message'
            ]);

        $this->assertDatabaseHas('automation_nodes', [
            'sequence_id' => $sequence->id,
            'name' => 'Test Action',
            'type' => 'app_action'
        ]);
    }

    /** @test */
    public function it_can_update_action()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $node = Action::factory()->create([
            'sequence_id' => $sequence->id,
            'name' => 'Original Action Name'
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/sequences/{$sequence->id}/actions/{$node->id}", [
                'name' => 'Updated Action Name',
                'configuration' => [
                    'name' => 'Updated Tag',
                    'contact' => '12345'
                ],
                'position' => ['x' => 200, 'y' => 200]
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'action',
                'message'
            ]);

        $this->assertDatabaseHas('automation_nodes', [
            'id' => $node->id,
            'name' => 'Updated Action Name'
        ]);
    }

    /** @test */
    public function it_can_delete_action()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $node = Action::factory()->create([
            'sequence_id' => $sequence->id
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/sequences/{$sequence->id}/actions/{$node->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Action deleted successfully']);

        $this->assertDatabaseMissing('automation_nodes', [
            'id' => $node->id
        ]);
    }

    /** @test */
    public function it_can_test_action()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $node = Action::factory()->create([
            'sequence_id' => $sequence->id,
            'type' => 'app_action',
            'arguments' => [
                'name' => 'Test Tag',
                'contact' => '12345'
            ],
            'metadata' => [
                'app_action_key' => 'create_contact_tag',
                'app_name' => 'kajabi'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/actions/{$node->id}/test");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data'
            ]);
    }

    /** @test */
    public function it_can_test_action_config()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi',
            'config' => [
                'subdomain' => 'test',
                'api_key' => 'test_key'
            ]
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/actions/test", [
                'name' => 'Test Action',
                'type' => 'app_action',
                'app_action_key' => 'create_contact_tag',
                'app_name' => 'kajabi',
                'configuration' => [
                    'name' => 'Test Tag',
                    'contact' => '12345'
                ]
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data'
            ]);
    }

    /** @test */
    public function it_can_store_webhook_trigger()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/webhook-triggers', [
                'sequence_id' => $sequence->id,
                'name' => 'Webhook Trigger',
                'conditions' => [],
                'webhook_auth_config' => [
                    'type' => 'none'
                ]
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'trigger' => [
                    'id',
                    'name',
                    'trigger_type',
                    'webhook_url',
                    'webhook_secret',
                    'is_active',
                    'display_info'
                ],
                'message'
            ]);

        $this->assertDatabaseHas('automation_triggers', [
            'sequence_id' => $sequence->id,
            'name' => 'Webhook Trigger',
            'trigger_type' => 'webhook'
        ]);
    }

    /** @test */
    public function it_prevents_access_to_other_organizations_sequences()
    {
        $otherOrganization = Organization::factory()->create();
        $sequence = Sequence::factory()->create([
            'organization_id' => $otherOrganization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/{$sequence->id}/edit");

        $response->assertStatus(403);
    }

    /** @test */
    public function it_prevents_access_to_other_organizations_integrations()
    {
        $otherOrganization = Organization::factory()->create();
        $integration = Integration::factory()->create([
            'organization_id' => $otherOrganization->id,
            'app_id' => $this->kajabiApp->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/automation-integrations/{$integration->uuid}/test");

        $response->assertStatus(403);
    }

    /** @test */
    public function it_validates_required_fields_for_sequence_creation()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/sequences', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function it_validates_required_fields_for_trigger_creation()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/triggers", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'app_id', 'integration_id', 'trigger_key']);
    }

    /** @test */
    public function it_validates_required_fields_for_action_creation()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/actions", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'type', 'configuration']);
    }

    /** @test */
    public function it_validates_required_fields_for_action_test()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequence->id}/actions/test", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'type', 'app_action_key', 'app_name', 'configuration']);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_sequence()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/sequences/999999/edit');

        $response->assertStatus(404);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_trigger()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/{$sequence->id}/triggers/999999");

        $response->assertStatus(404);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_action()
    {
        $sequence = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/sequences/{$sequence->id}/actions/999999");

        $response->assertStatus(404);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_integration()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/automation-integrations/nonexistent-uuid/test');

        $response->assertStatus(404);
    }

    /** @test */
    public function it_prevents_modifying_triggers_from_other_sequences()
    {
        $sequence1 = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $sequence2 = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $trigger = Trigger::factory()->create([
            'sequence_id' => $sequence1->id
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/sequences/{$sequence2->id}/triggers/{$trigger->id}", [
                'name' => 'Updated Name'
            ]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'Trigger does not belong to this sequence']);
    }

    /** @test */
    public function it_prevents_modifying_actions_from_other_sequences()
    {
        $sequence1 = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $sequence2 = Sequence::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->user->id
        ]);

        $node = Action::factory()->create([
            'sequence_id' => $sequence1->id
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/sequences/{$sequence2->id}/actions/{$node->id}", [
                'name' => 'Updated Name'
            ]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'Action does not belong to this sequence']);
    }
}
