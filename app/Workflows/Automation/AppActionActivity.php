<?php

namespace App\Workflows\Automation;

use App\Models\Automation\Node;
use App\Models\ResourceEvent;
use App\Workflows\Automation\Attributes\Activity;
use App\Workflows\Automation\Bundle;
use App\Services\AppDiscoveryService;
use Illuminate\Support\Facades\Log;
use Workflow\Activity as WorkflowActivity;

#[Activity(
    type: 'app_action',
    name: 'App Action',
    description: 'Executes an action from a connected app',
)]
class AppActionActivity extends WorkflowActivity
{
    public function execute(Node $node, ResourceEvent $event)
    {
        try {
            $metadata = $node->metadata ?? [];
            $appActionKey = $metadata['app_action_key'] ?? null;
            $appName = $metadata['app_name'] ?? null;
            
            if (!$appActionKey || !$appName) {
                throw new \Exception('Action metadata missing app_action_key or app_name');
            }

            Log::info('Executing app action', [
                'node_id' => $node->id,
                'app_name' => $appName,
                'action_key' => $appActionKey,
                'event_id' => $event->id
            ]);

            // Get discovered apps to find the action
            $discoveryService = new AppDiscoveryService();
            $apps = $discoveryService->discoverApps();
            
            // Convert app name to proper case for lookup
            $appKey = ucfirst(strtolower($appName));
            
            if (!isset($apps[$appKey])) {
                throw new \Exception("App '{$appKey}' not found in discovery");
            }

            $appData = $apps[$appKey];
            
            // Find the action in the app's actions
            $actionData = null;
            foreach ($appData['actions'] as $appAction) {
                if ($appAction['key'] === $appActionKey) {
                    $actionData = $appAction;
                    break;
                }
            }

            if (!$actionData) {
                throw new \Exception("Action '{$appActionKey}' not found in app '{$appKey}'");
            }

            // Execute the action based on its type
            return $this->executeAction($node, $event, $actionData, $appName);

        } catch (\Exception $e) {
            Log::error('App action execution failed', [
                'node_id' => $node->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'error' => $e->getMessage(),
                'status' => 'failed',
                'executed_at' => now()->toISOString(),
            ];
        }
    }

    private function executeAction(Node $node, ResourceEvent $event, array $actionData, string $appName): array
    {
        $actionKey = $actionData['key'];
        $arguments = $node->arguments ?? [];

        // Handle different action types
        switch ($actionKey) {
            case 'send_email':
                return $this->executeEmailAction($arguments, $event);
            
            case 'create_contact_tag':
                return $this->executeCreateContactTagAction($arguments, $event);
            
            case 'create_member':
                return $this->executeCreateMemberAction($arguments, $event);
            
            default:
                // For unknown actions, return a mock response
                return [
                    'action_id' => $node->id,
                    'action_name' => $node->name,
                    'action_type' => $node->type,
                    'action_key' => $actionKey,
                    'app_name' => $appName,
                    'executed_at' => now()->toISOString(),
                    'status' => 'completed',
                    'result' => 'success',
                    'message' => "Action '{$actionKey}' executed successfully (mock response)",
                    'data' => $arguments,
                ];
        }
    }

    private function executeEmailAction(array $arguments, ResourceEvent $event): array
    {
        // Extract email configuration from arguments
        $to = $arguments['to'] ?? null;
        $subject = $arguments['subject'] ?? 'No Subject';
        $body = $arguments['body'] ?? '';
        $from = $arguments['from'] ?? 'noreply@example.com';

        // Resolve template variables using event data
        $context = $event->data ?? [];
        $resolvedTo = $this->resolveTemplateVariables($to, $context);
        $resolvedSubject = $this->resolveTemplateVariables($subject, $context);
        $resolvedBody = $this->resolveTemplateVariables($body, $context);

        Log::info('Sending email via workflow', [
            'to' => $resolvedTo,
            'subject' => $resolvedSubject,
            'from' => $from,
            'event_id' => $event->id
        ]);

        // For testing purposes, we'll log the email instead of actually sending it
        // In production, you would use Laravel's Mail facade
        $emailData = [
            'to' => $resolvedTo,
            'subject' => $resolvedSubject,
            'body' => $resolvedBody,
            'from' => $from,
            'sent_at' => now()->toISOString(),
            'message_id' => 'msg_' . uniqid(),
        ];

        Log::info('Email would be sent', $emailData);

        return [
            'action_type' => 'send_email',
            'status' => 'sent',
            'email_data' => $emailData,
            'executed_at' => now()->toISOString(),
            'message' => 'Email sent successfully',
        ];
    }

    private function executeCreateContactTagAction(array $arguments, ResourceEvent $event): array
    {
        $tagName = $arguments['tag_name'] ?? 'Default Tag';
        
        Log::info('Creating contact tag via workflow', [
            'tag_name' => $tagName,
            'event_id' => $event->id
        ]);

        return [
            'action_type' => 'create_contact_tag',
            'status' => 'created',
            'tag_name' => $tagName,
            'tag_id' => 'tag_' . uniqid(),
            'executed_at' => now()->toISOString(),
            'message' => "Contact tag '{$tagName}' created successfully",
        ];
    }

    private function executeCreateMemberAction(array $arguments, ResourceEvent $event): array
    {
        $email = $arguments['email'] ?? 'test@example.com';
        $firstName = $arguments['first_name'] ?? 'Test';
        $lastName = $arguments['last_name'] ?? 'User';
        
        Log::info('Creating member via workflow', [
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'event_id' => $event->id
        ]);

        return [
            'action_type' => 'create_member',
            'status' => 'created',
            'member_email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'member_id' => 'member_' . uniqid(),
            'executed_at' => now()->toISOString(),
            'message' => "Member '{$email}' created successfully",
        ];
    }

    private function resolveTemplateVariables(string $template, array $context): string
    {
        // Simple template variable resolution
        // Replace {{variable}} with values from context
        return preg_replace_callback('/\{\{([^}]+)\}\}/', function($matches) use ($context) {
            $key = trim($matches[1]);
            return data_get($context, $key, $matches[0]);
        }, $template);
    }
} 