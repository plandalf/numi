<?php

namespace App\Workflows\Automation;

use App\Models\Automation\Node;
use App\Models\ResourceEvent;
use App\Workflows\Automation\ActivitySchemaRegistry;
use Exception;
use Workflow\ActivityStub;
use Workflow\Workflow;

class SingleActivityTestWorkflow extends Workflow
{
    public function execute(string $activityType, array $nodeData, array $testData, int $organizationId)
    {
        \Log::info('SingleActivityTestWorkflow::execute started', [
            'activity_type' => $activityType,
            'node_data' => $nodeData,
            'test_data' => $testData,
            'organization_id' => $organizationId,
            'context' => 'workflow_queue',
        ]);
        
        try {
            // Create a real Node object but don't save it to database
            $node = new Node($nodeData);
            $node->exists = false; // Ensure it's treated as a new model that won't be saved
            $node->syncOriginal(); // Mark all attributes as clean to prevent accidental saves
            
            // Create a test ResourceEvent with organization context
            $event = $this->createTestEvent($testData, $organizationId);
            
            // Get the activity class from the registry
            $activityClass = app(ActivitySchemaRegistry::class)
                ->getActivityClassForType($activityType);
            
            if (!$activityClass) {
                throw new Exception("Activity type not found: {$activityType}");
            }
            
            \Log::info('About to execute activity', [
                'activity_class' => $activityClass,
                'node_type' => $node->type ?? 'unknown',
                'event_id' => $event->id ?? 'no_id',
            ]);
            
            // Execute the activity
            $result = yield ActivityStub::make($activityClass, $node, $event);
            
            \Log::info('Activity execution completed', [
                'result' => $result,
            ]);
            
            return [
                'success' => true,
                'activity_type' => $activityType,
                'result' => $result,
                'node_data' => $nodeData,
                'test_data' => $testData,
                'organization_id' => $organizationId,
                'executed_at' => now()->toISOString(),
            ];
        } catch (\Exception $e) {
            \Log::error('SingleActivityTestWorkflow::execute failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'activity_type' => $activityType,
                'organization_id' => $organizationId,
            ]);
            throw $e;
        }
    }
    
    private function createTestEvent(array $testData, int $organizationId): ResourceEvent
    {
        return ResourceEvent::createTestEvent($testData, $organizationId);
    }
} 