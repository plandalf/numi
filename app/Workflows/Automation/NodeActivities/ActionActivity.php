<?php

namespace App\Workflows\Automation\NodeActivities;

use App\Models\Automation\Action;
use App\Models\Integration;
use App\Services\AppDiscoveryService;
use App\Workflows\Automation\Attributes\Activity;
use App\Workflows\Automation\Bundle;
use Illuminate\Support\Facades\Log;
use Workflow\Activity as WorkflowActivity;

#[Activity(
    type: 'app_action',
    name: 'App Action',
    description: 'Executes an action from a connected app',
)]
class ActionActivity extends WorkflowActivity
{
    public $tries = 3;

    public $maxExceptions = 1;

    public $timeout = 20;

    public function execute(Action $node, Bundle $bundle)
    {
        try {
            Log::info('workflow.action_activity.enter', [
                'node_id' => $node->id ?? null,
                'node_app_id' => $node->app_id ?? null,
                'bundle_has_integration' => (bool) ($bundle->integration ?? false),
            ]);
        } catch (\Throwable $e) {}
        // Ensure required relations are available after rehydration
        $node->loadMissing(['integration', 'app']);

        // Prefer bundle integration; fall back to node's integration, then org-level app integration.
        // When models are rehydrated via SerializesModels relationships may be unloaded, so attempt to reload.
        $integration = $bundle->integration ?: $node->integration;
        if (! $integration && $node->getAttribute('integration_id')) {
            $integration = Integration::query()->find($node->getAttribute('integration_id'));
        }
        if (! $integration && $node->app_id) {
            $integration = Integration::query()
                ->where('organization_id', $bundle->organization->id)
                ->where('app_id', $node->app_id)
                ->first();
        }

        // Log selection status
        try {
            Log::info('workflow.action_activity.integration_selected', [
                'organization_id' => $bundle->organization->id,
                'node_id' => $node->id,
                'node_app_id' => $node->app_id,
                'bundle_has_integration' => (bool) $bundle->integration,
                'node_has_integration' => (bool) $node->integration,
                'selected_integration_id' => $integration?->id,
            ]);
        } catch (\Throwable $e) {
            // ignore logging errors
        }

        // Integration is optional at the activity level; specific actions may still require it
        if (! $integration) {
            Log::debug('workflow.action_activity.no_integration_available', [
                'organization_id' => $bundle->organization->id,
                'node_id' => $node->id,
                'node_app_id' => $node->app_id,
            ]);
        }

        // Get discovered apps to find the action
        $discoveryService = new AppDiscoveryService;
        $data = $discoveryService->getApp($node->app->key);

        $action = collect($data['actions'])
            ->firstWhere('key', $node->action_key);

        if (! $action) {
            throw new \Exception("Action not found: {$node->action_key}");
        }

        $e = new $action['class'];

        // Pass through a bundle guaranteed to contain an integration
        $bundleWithIntegration = new Bundle(
            organization: $bundle->organization,
            input: $bundle->input,
            configuration: $bundle->configuration,
            integration: $integration,
        );

        try {
            Log::info('workflow.action_activity.invoking_action', [
                'node_id' => $node->id,
                'action_key' => $node->action_key,
                'app_key' => $node->app->key ?? null,
                'has_integration' => (bool) $integration,
                'integration_id' => $integration?->id,
            ]);
        } catch (\Throwable $e) {
            // ignore
        }

        return $e($bundleWithIntegration);
    }
}
