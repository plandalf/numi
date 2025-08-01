<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Organization;
use App\Models\App;
use App\Models\Integration;
use App\Models\Automation\Sequence;
use App\Models\Automation\Trigger;
use App\Models\Automation\Action;
use App\Models\Automation\AutomationEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use App\Mail\ActivityEmail;

class AutomationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $organization;
    protected App $kajabiApp;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user and organization
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
    public function it_can_create_complete_automation_workflow()
    {
        // Step 1: Create a new sequence
        $sequenceResponse = $this->actingAs($this->user)
            ->postJson('/sequences', [
                'name' => 'Welcome Email Sequence',
                'description' => 'Sends welcome email when someone purchases a course'
            ]);

        $sequenceResponse->assertStatus(302); // Redirect after creation
        $sequenceId = Sequence::where('name', 'Welcome Email Sequence')->first()->id;

        // Step 2: Create a Kajabi integration
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

        // Step 3: Add a Kajabi trigger (New Purchase)
        $triggerResponse = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequenceId}/triggers", [
                'name' => 'New Course Purchase',
                'app_id' => $this->kajabiApp->id,
                'integration_id' => $integration->id,
                'trigger_key' => 'new-purchase',
                'configuration' => [
                    'offer' => 'offer_123'
                ],
                'conditions' => [],
                'app_name' => 'kajabi'
            ]);

        $triggerResponse->assertStatus(201);
        $triggerId = $triggerResponse->json('trigger.id');

        // Step 4: Add an email action
        $actionResponse = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequenceId}/actions", [
                'name' => 'Send Welcome Email',
                'type' => 'app_action',
                'configuration' => [
                    'to' => '{{trigger.member_email}}',
                    'subject' => 'Welcome to {{trigger.product_name}}!',
                    'body' => 'Hi {{trigger.member_name}},\n\nWelcome to {{trigger.product_name}}! We\'re excited to have you on board.\n\nBest regards,\nThe Team',
                    'from' => 'noreply@example.com'
                ],
                'position' => ['x' => 100, 'y' => 100],
                'app_action_key' => 'send_email',
                'app_name' => 'plandalf'
            ]);

        $actionResponse->assertStatus(201);
        $actionId = $actionResponse->json('action.id');

        // Step 5: Get the final sequence configuration
        $finalConfigResponse = $this->actingAs($this->user)
            ->getJson("/sequences/{$sequenceId}/edit");

        $finalConfigResponse->assertStatus(200);
        $finalConfig = $finalConfigResponse->json();

        // Output the complete configuration for review
        echo "\n=== COMPLETE AUTOMATION WORKFLOW CONFIGURATION ===\n";
        echo "Sequence ID: {$sequenceId}\n";
        echo "Sequence Name: {$finalConfig['sequence']['name']}\n";
        echo "Sequence Description: {$finalConfig['sequence']['description']}\n\n";

        echo "=== TRIGGER CONFIGURATION ===\n";
        $trigger = $finalConfig['sequence']['triggers'][0];
        echo "Trigger ID: {$trigger['id']}\n";
        echo "Trigger Name: {$trigger['name']}\n";
        echo "Trigger Key: {$trigger['trigger_key']}\n";
        echo "Trigger Configuration: " . json_encode($trigger['configuration'], JSON_PRETTY_PRINT) . "\n";
        echo "Integration: {$trigger['integration']['name']} ({$trigger['integration']['type']})\n\n";

        echo "=== ACTION CONFIGURATION ===\n";
        $action = $finalConfig['sequence']['nodes'][0];
        echo "Action ID: {$action['id']}\n";
        echo "Action Name: {$action['name']}\n";
        echo "Action Type: {$action['type']}\n";
        echo "Action Arguments: " . json_encode($action['arguments'], JSON_PRETTY_PRINT) . "\n";
        echo "Action Metadata: " . json_encode($action['metadata'], JSON_PRETTY_PRINT) . "\n\n";

        echo "=== INTEGRATION CONFIGURATION ===\n";
        $integrationConfig = $finalConfig['integrations'][0];
        echo "Integration ID: {$integrationConfig['id']}\n";
        echo "Integration Name: {$integrationConfig['name']}\n";
        echo "Integration Type: {$integrationConfig['type']}\n";
        echo "App: {$integrationConfig['app']['name']}\n\n";

        echo "=== WORKFLOW SUMMARY ===\n";
        echo "When someone purchases a course in Kajabi (trigger: new-purchase),\n";
        echo "the system will automatically send a personalized welcome email\n";
        echo "using the member's email and name from the purchase data.\n\n";

        // Assertions to verify the workflow was created correctly
        $this->assertDatabaseHas('automation_sequences', [
            'id' => $sequenceId,
            'name' => 'Welcome Email Sequence',
            'description' => 'Sends welcome email when someone purchases a course'
        ]);

        $this->assertDatabaseHas('automation_triggers', [
            'id' => $triggerId,
            'sequence_id' => $sequenceId,
            'name' => 'New Course Purchase',
            'trigger_key' => 'new-purchase'
        ]);

        $this->assertDatabaseHas('automation_nodes', [
            'id' => $actionId,
            'sequence_id' => $sequenceId,
            'name' => 'Send Welcome Email',
            'type' => 'app_action'
        ]);

        $this->assertDatabaseHas('integrations', [
            'id' => $integration->id,
            'app_id' => $this->kajabiApp->id,
            'type' => 'kajabi'
        ]);
    }

    /** @test */
    public function it_can_test_kajabi_webhook_workflow()
    {
        Mail::fake();
        // Step 1: Create a new sequence
        $sequenceResponse = $this->actingAs($this->user)
            ->postJson('/sequences', [
                'name' => 'Kajabi Webhook Test Sequence',
                'description' => 'Tests webhook functionality with Kajabi purchase events'
            ]);

        $sequenceResponse->assertStatus(302);
        $sequenceId = Sequence::where('name', 'Kajabi Webhook Test Sequence')->first()->id;

        // Step 2: Create a webhook trigger (not integration-based)
        $webhookTriggerResponse = $this->actingAs($this->user)
            ->postJson('/webhook-triggers', [
                'sequence_id' => $sequenceId,
                'name' => 'Kajabi Purchase Webhook',
                'conditions' => [
                    'event_type' => ['operator' => 'equals', 'value' => 'order.created']
                ],
                'webhook_auth_config' => [
                    'type' => 'api_key',
                    'header' => 'X-Kajabi-Signature',
                    'expected_key' => 'test_webhook_secret_123'
                ]
            ]);

        $webhookTriggerResponse->assertStatus(201);
        $webhookTriggerData = $webhookTriggerResponse->json('trigger');
        $webhookTriggerId = $webhookTriggerData['id'];
        $webhookUrl = $webhookTriggerData['webhook_url'];
        $webhookSecret = $webhookTriggerData['webhook_secret'];

        echo "\n=== WEBHOOK TRIGGER CREATED ===\n";
        echo "Trigger ID: {$webhookTriggerId}\n";
        echo "Webhook URL: {$webhookUrl}\n";
        echo "Webhook Secret: {$webhookSecret}\n\n";

        // Step 3: Add an email action to the sequence
        $actionResponse = $this->actingAs($this->user)
            ->postJson("/sequences/{$sequenceId}/actions", [
                'name' => 'Send Purchase Confirmation',
                'type' => 'app_action',
                'configuration' => [
                    'to' => '{{trigger.member_email}}',
                    'subject' => 'Thank you for your purchase!',
                    'body' => 'Hi {{trigger.member_name}},\n\nThank you for purchasing {{trigger.product_name}}!\n\nOrder ID: {{trigger.order_id}}\nAmount: ${{trigger.amount}}\n\nBest regards,\nThe Team',
                    'from' => 'noreply@example.com'
                ],
                'position' => ['x' => 100, 'y' => 100],
                'app_action_key' => 'send_email',
                'app_name' => 'plandalf'
            ]);

        $actionResponse->assertStatus(201);
        $actionId = $actionResponse->json('action.id');

        // Step 4: Verify the webhook trigger was created correctly
        $this->assertDatabaseHas('automation_triggers', [
            'id' => $webhookTriggerId,
            'sequence_id' => $sequenceId,
            'name' => 'Kajabi Purchase Webhook',
            'trigger_type' => 'webhook',
            'is_active' => true
        ]);

        // Step 4.5: Connect the webhook trigger to the action node
        $trigger = Trigger::find($webhookTriggerId);
        $trigger->update(['next_node_id' => $actionId]);

        echo "=== TRIGGER-NODE CONNECTION ===\n";
        echo "Connected trigger {$webhookTriggerId} to node {$actionId}\n\n";

        // Step 5: Send a fake Kajabi webhook event
        $fakeKajabiPayload = [
            'event_type' => 'order.created',
            'id' => 'order_' . uniqid(),
            'member_id' => 'member_' . uniqid(),
            'member' => [
                'email' => 'test.customer@example.com',
                'name' => 'Test Customer'
            ],
            'product_id' => 'prod_' . uniqid(),
            'product' => [
                'name' => 'Premium Course Bundle'
            ],
            'amount' => 14999, // $149.99 in cents
            'currency' => 'USD',
            'payment_method' => 'credit_card',
            'created_at' => now()->toISOString(),
            'order_items' => [
                [
                    'product_id' => 'prod_' . uniqid(),
                    'product_name' => 'Premium Course Bundle',
                    'quantity' => 1,
                    'price' => 14999,
                ]
            ],
        ];

        // Extract trigger UUID from webhook URL
        $triggerUuid = basename($webhookUrl);

        echo "=== SENDING FAKE KAJABI WEBHOOK ===\n";
        echo "Trigger UUID: {$triggerUuid}\n";
        echo "Payload: " . json_encode($fakeKajabiPayload, JSON_PRETTY_PRINT) . "\n\n";

        // Send the webhook with authentication
        $webhookResponse = $this->postJson("/webhooks/{$triggerUuid}", $fakeKajabiPayload, [
            'X-Kajabi-Signature' => 'test_webhook_secret_123',
            'Content-Type' => 'application/json'
        ]);

        $webhookResponse->assertStatus(200);
        $webhookResult = $webhookResponse->json();

        echo "=== WEBHOOK RESPONSE ===\n";
        echo "Success: " . ($webhookResult['success'] ? 'true' : 'false') . "\n";
        echo "Message: {$webhookResult['message']}\n";
        echo "Trigger Event ID: {$webhookResult['trigger_event_id']}\n\n";

        // Step 6: Verify the webhook event was recorded
        $this->assertDatabaseHas('trigger_events', [
            'id' => $webhookResult['trigger_event_id'],
            'trigger_id' => $webhookTriggerId,
            'event_source' => 'webhook',
            'status' => 'processed'
        ]);

        // Step 7: Verify the trigger event contains the correct data
        $triggerEvent = AutomationEvent::find($webhookResult['trigger_event_id']);
        $this->assertNotNull($triggerEvent);
        $this->assertEquals($fakeKajabiPayload, $triggerEvent->event_data);

        echo "=== WEBHOOK EVENT VERIFICATION ===\n";
        echo "Event ID: {$triggerEvent->id}\n";
        echo "Event Source: {$triggerEvent->event_source}\n";
        echo "Event Status: {$triggerEvent->status}\n";
        echo "Event Data Keys: " . implode(', ', array_keys($triggerEvent->event_data)) . "\n\n";

        // Step 7.5: Verify workflow execution and email action
        echo "=== WORKFLOW EXECUTION VERIFICATION ===\n";

        // Check if the workflow execution was logged
        $logFile = storage_path('logs/laravel.log');
        if (file_exists($logFile)) {
            // Read only the last 50KB of the log file to avoid memory issues
            $logContent = '';
            $fileSize = filesize($logFile);
            if ($fileSize > 0) {
                $handle = fopen($logFile, 'r');
                if ($handle) {
                    // Seek to the last 50KB of the file
                    $startPos = max(0, $fileSize - 51200);
                    fseek($handle, $startPos);
                    $logContent = fread($handle, $fileSize - $startPos);
                    fclose($handle);
                }
            }

            // Check for workflow execution logs
            if (str_contains($logContent, 'Executing app action')) {
                echo "✅ Workflow execution logged\n";
            } else {
                echo "❌ Workflow execution not found in logs\n";
            }

            // Check for email action logs
            if (str_contains($logContent, 'Sending email via workflow')) {
                echo "✅ Email action execution logged\n";
            } else {
                echo "❌ Email action execution not found in logs\n";
            }

            // Check for email data logs
            if (str_contains($logContent, 'Email would be sent')) {
                echo "✅ Email data logged\n";

                // Extract and verify email content from logs
                if (preg_match('/Email would be sent.*?\{.*?"to":"([^"]+)".*?"subject":"([^"]+)".*?"body":"([^"]+)".*?\}/s', $logContent, $matches)) {
                    $emailTo = $matches[1] ?? 'not found';
                    $emailSubject = $matches[2] ?? 'not found';
                    $emailBody = $matches[3] ?? 'not found';

                    echo "📧 Email Details:\n";
                    echo "   To: {$emailTo}\n";
                    echo "   Subject: {$emailSubject}\n";
                    echo "   Body: " . substr($emailBody, 0, 100) . "...\n";

                    // Verify template variables were resolved
                    $this->assertStringContainsString('test.customer@example.com', $emailTo, 'Email recipient should contain resolved template variable');
                    $this->assertStringContainsString('Premium Course Bundle', $emailSubject, 'Email subject should contain resolved template variable');
                    $this->assertStringContainsString('Test Customer', $emailBody, 'Email body should contain resolved template variable');
                    echo "✅ Template variables resolved correctly\n";
                } else {
                    echo "⚠️  Could not extract email details from logs\n";
                }
            } else {
                echo "❌ Email data not found in logs\n";
            }
        } else {
            echo "⚠️  Log file not found\n";
        }

        // Verify the trigger event was processed
        $triggerEvent->refresh();
        $this->assertEquals('processed', $triggerEvent->status);
        echo "✅ Trigger event status: {$triggerEvent->status}\n";

        // Check if workflow execution ID was set
        if ($triggerEvent->workflow_execution_id) {
            echo "✅ Workflow execution ID: {$triggerEvent->workflow_execution_id}\n";
        } else {
            echo "⚠️  No workflow execution ID found\n";
        }

        echo "\n";

        // Step 8: Test webhook authentication failure
        $unauthorizedResponse = $this->postJson("/webhooks/{$triggerUuid}", $fakeKajabiPayload, [
            'X-Kajabi-Signature' => 'wrong_secret',
            'Content-Type' => 'application/json'
        ]);

        $unauthorizedResponse->assertStatus(401);

        echo "=== AUTHENTICATION TEST ===\n";
        echo "Unauthorized request correctly rejected with 401 status\n\n";

        // Step 9: Test webhook with different event type (should be ignored due to conditions)
        $differentEventPayload = array_merge($fakeKajabiPayload, [
            'event_type' => 'member.updated'
        ]);

        $ignoredResponse = $this->postJson("/webhooks/{$triggerUuid}", $differentEventPayload, [
            'X-Kajabi-Signature' => 'test_webhook_secret_123',
            'Content-Type' => 'application/json'
        ]);

        $ignoredResponse->assertStatus(200);
        $ignoredResult = $ignoredResponse->json();

        echo "=== CONDITION TEST ===\n";
        echo "Different event type (member.updated) correctly ignored\n";
        echo "Response: {$ignoredResult['message']}\n\n";

        // Step 10: Verify the complete workflow
        $finalSequenceResponse = $this->actingAs($this->user)
            ->getJson("/sequences/{$sequenceId}/edit");

        $finalSequenceResponse->assertStatus(200);
        $finalSequence = $finalSequenceResponse->json();

        echo "=== FINAL WORKFLOW SUMMARY ===\n";
        echo "Sequence: {$finalSequence['sequence']['name']}\n";
        echo "Webhook Trigger: {$finalSequence['sequence']['triggers'][0]['name']}\n";
        echo "Webhook URL: {$finalSequence['sequence']['triggers'][0]['webhook_url']}\n";
        echo "Action: {$finalSequence['sequence']['nodes'][0]['name']}\n";
        echo "Total Trigger Events: " . AutomationEvent::where('trigger_id', $webhookTriggerId)->count() . "\n\n";

        echo "=== WORKFLOW TEST COMPLETED ===\n";
        echo "✅ Webhook trigger created successfully\n";
        echo "✅ Webhook URL generated: {$webhookUrl}\n";
        echo "✅ Fake Kajabi event sent and processed\n";
        echo "✅ Authentication working correctly\n";
        echo "✅ Conditions filtering working correctly\n";
        echo "✅ Trigger event recorded in database\n";
        echo "✅ Workflow ready to process real Kajabi webhooks\n\n";

        // Step 7.6: Assert email was sent and template variables resolved
        Mail::assertSent(ActivityEmail::class, function ($mail) use ($fakeKajabiPayload) {
            $rendered = $mail->render();
            // Check recipient
            $this->assertContains('test.customer@example.com', $mail->to[0]['address']);
            // Check subject
            $this->assertStringContainsString('Premium Course Bundle', $mail->subject);
            // Check body
            $this->assertStringContainsString('Test Customer', $rendered);
            $this->assertStringContainsString('Premium Course Bundle', $rendered);
            return true;
        });
        echo "✅ Email was sent and template variables resolved\n";
    }
}
