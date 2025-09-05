# Zapier for Commerce - Automation Platform

## Implementation Todo List

### ✅ Phase 1: Database Foundation (Priority: Critical) - COMPLETED

#### 1.1 Database Schema Migration - COMPLETED
- [x] **Create new tables migration** → [Database Schema Enhancements](#database-schema-enhancements)
  - [x] `apps` table for integration definitions
  - [x] `integrations` table for user service connections
  - [x] `workflow_executions` table for execution tracking
  - [x] `workflow_steps` table for step-by-step execution
  - [x] `workflow_templates` table for pre-built templates
  - [x] `data_mappings` table for field transformations
  - [x] `workflow_tests` table for testing framework
  - [x] `workflow_step_tests` table for step testing
  - [x] `trigger_events` table for all trigger initiation data

#### 1.2 Enhance Existing Tables - COMPLETED
- [x] **Modify `automation_sequences`** → [Enhanced Existing Tables](#enhanced-existing-tables)
  - [x] Add `description`, `is_active`, `metadata`, `settings` columns
  - [x] Add `created_by`, `last_run_at`, `run_count` tracking
- [x] **Modify `automation_nodes`** → [Enhanced Existing Tables](#enhanced-existing-tables)
  - [x] Add `integration_id`, `app_action_id` foreign keys
  - [x] Add `configuration` JSON field (replace `arguments`)
  - [x] Add `position`, `metadata`, `retry_config` fields
- [x] **Modify `automation_triggers`** → [Enhanced Existing Tables](#enhanced-existing-tables)
  - [x] Add `integration_id`, `app_trigger_id` foreign keys
  - [x] Add `conditions`, `webhook_url`, `is_active` fields
  - [x] Remove deprecated `event_name`, `target_type`, `target_id`
- [x] **Modify `automation_edges`**
  - [x] Add `conditions`, `metadata` JSON fields

### ✅ Phase 2: UI Implementation for Trigger Management (Priority: Critical) - COMPLETED

#### 2.1 Enhanced Sequences Edit Page - COMPLETED
- [x] **Updated edit.tsx Component** → [Enhanced UI for Sequences](#enhanced-ui-for-sequences)
  - [x] Added quick stats dashboard showing triggers, actions, apps, and integrations count
  - [x] Enhanced trigger display with app branding and detailed information
  - [x] Added functional "Add Trigger" buttons throughout the interface
  - [x] Added available apps showcase section highlighting Kajabi integration
  - [x] Improved empty states with call-to-action buttons
  - [x] Added delete trigger functionality with confirmation
  - [x] Real-time state management for triggers

#### 2.2 AddTriggerModal Component - COMPLETED
- [x] **Multi-step Modal Implementation** → [AddTriggerModal Component](#addtriggermodal-component)
  - [x] Step 1: App selection with visual app cards and category badges
  - [x] Step 2: Integration management with tabs for existing/new integrations
  - [x] Step 3: Trigger event selection with detailed descriptions
  - [x] Step 4: Configuration with custom naming
  - [x] Automatic integration detection and routing
  - [x] Kajabi-specific credentials form (API key + subdomain)
  - [x] Real-time connection testing and validation
  - [x] Success states and loading indicators

#### 2.3 Backend Routes and Controller Methods - COMPLETED
- [x] **Enhanced SequencesController** → [SequencesController Enhancements](#sequencescontroller-enhancements)
  - [x] `getApps()` - Retrieve all active apps
  - [x] `getApp()` - Get specific app with triggers/actions
  - [x] `getIntegrations()` - Get organization integrations
  - [x] `storeIntegration()` - Create new integration with credentials
  - [x] `testIntegration()` - Test integration connection
  - [x] `updateIntegration()` - Update integration settings
  - [x] `destroyIntegration()` - Delete integration
  - [x] `storeTrigger()` - Create trigger for sequence
  - [x] `updateTrigger()` - Update trigger configuration
  - [x] `destroyTrigger()` - Delete trigger

#### 2.4 Route Structure - COMPLETED
- [x] **Sequences Routes** → [Route Structure](#route-structure)
  ```php
  // Sequences automation routes
  Route::prefix('sequences/{sequence}')->name('sequences.')->group(function () {
      Route::get('/apps', [SequencesController::class, 'getApps'])->name('apps.index');
      Route::post('/triggers', [SequencesController::class, 'storeTrigger'])->name('triggers.store');
      Route::put('/triggers/{trigger}', [SequencesController::class, 'updateTrigger'])->name('triggers.update');
      Route::delete('/triggers/{trigger}', [SequencesController::class, 'destroyTrigger'])->name('triggers.destroy');
  });

  // Apps and automation API routes
  Route::prefix('apps')->name('apps.')->group(function () {
      Route::get('/', [SequencesController::class, 'getApps'])->name('index');
      Route::get('/{app}', [SequencesController::class, 'getApp'])->name('show');
      Route::get('/{app}/triggers', [SequencesController::class, 'getAppTriggers'])->name('triggers');
      Route::get('/{app}/actions', [SequencesController::class, 'getAppActions'])->name('actions');
  });

  // Integration management for automation
  Route::prefix('automation-integrations')->name('automation-integrations.')->group(function () {
      Route::get('/', [SequencesController::class, 'getIntegrations'])->name('index');
      Route::post('/', [SequencesController::class, 'storeIntegration'])->name('store');
      Route::get('/{integration}/test', [SequencesController::class, 'testIntegration'])->name('test');
      Route::put('/{integration}', [SequencesController::class, 'updateIntegration'])->name('update');
      Route::delete('/{integration}', [SequencesController::class, 'destroyIntegration'])->name('destroy');
  });
  ```

#### 2.5 Kajabi App Integration - COMPLETED
- [x] **Added Kajabi to AutomationSeeder** → [Kajabi App Definition](#kajabi-app-definition)
  - [x] Complete Kajabi app definition with "New Order" trigger
  - [x] "Order Completed" trigger for payment confirmations
  - [x] "Create Tag" and "Add Member Tag" actions
  - [x] API key + subdomain authentication schema
  - [x] Webhook configuration with signature verification
  - [x] Rate limiting and documentation URLs
  - [x] Comprehensive output schemas for trigger data

### Implementation Summary

The automation platform now supports:

1. **Visual App Selection**: Users can browse available apps (Shopify, Kajabi, Slack, Webhook) with branded cards
2. **Kajabi Integration Flow**: Complete setup flow for Kajabi with API key and subdomain authentication
3. **Trigger Management**: Full CRUD operations for triggers with real-time UI updates
4. **Integration Testing**: Connection validation before activating integrations
5. **Multi-step Workflows**: Guided setup process from app selection to trigger configuration

### Key Features Implemented

#### Enhanced UI Components
- **Quick Stats Dashboard**: Real-time counts of triggers, actions, apps, and integrations
- **App Showcase**: Visual grid of available apps with Kajabi highlighting
- **Trigger Cards**: Branded trigger displays with app icons, names, and status badges
- **Empty States**: Actionable empty states with clear call-to-action buttons

#### Kajabi-Specific Features
- **API Key Authentication**: Secure storage of Kajabi API keys and subdomain
- **New Order Trigger**: Complete trigger definition for Kajabi order events
- **Connection Testing**: Real-time validation of Kajabi API credentials
- **Branded UI**: Kajabi-specific colors and branding in the interface

#### Backend Architecture
- **RESTful API**: Clean API endpoints for apps, integrations, and triggers
- **Organization Scoped**: All operations properly scoped to user's organization
- **Validation & Security**: Proper request validation and authorization checks
- **Error Handling**: Comprehensive error handling with user-friendly messages

### User Flow Completed

1. **User clicks "Add Trigger"** → Opens AddTriggerModal
2. **Selects Kajabi app** → System checks for existing integrations
3. **Creates new integration** → Enters API key and subdomain
4. **Tests connection** → Validates credentials with Kajabi API
5. **Selects "New Order" trigger** → Chooses from available Kajabi triggers
6. **Configures trigger** → Names the trigger and saves
7. **Trigger created** → Returns to sequences page with new trigger displayed

### Security & Validation
- **Credentials Encryption**: Sensitive API keys encrypted in database
- **CSRF Protection**: All form submissions protected with CSRF tokens
- **Organization Isolation**: Users can only access their organization's data
- **Input Validation**: Comprehensive validation on all API endpoints
- **Connection Testing**: Real authentication testing before activation

This implementation provides a solid foundation for the automation platform with a focus on Kajabi integration as requested. The system is designed to be extensible for additional apps and triggers in the future.

### Phase 3: Core Models & Relationships (Priority: Critical)

#### 3.1 App System Models
- [ ] **Create `App` model** → [App (Integration Definition)](#app-integration-definition)
  - [ ] Define fillable fields and casts (including logo_url, lookup_key)
  - [ ] Add relationships to `AppTrigger`, `AppAction`, `Integration`
  - [ ] Add validation rules and scopes
  - [ ] Add app metadata fields (developer info, documentation)
- [ ] **Create `AppTrigger` model** → [AppTrigger (Available Triggers per App)](#apptrigger-available-triggers-per-app)
  - [ ] Define schema validation methods
  - [ ] Add relationship to `App`
- [ ] **Create `AppAction` model** → [AppAction (Available Actions per App)](#appaction-available-actions-per-app)
  - [ ] Define schema validation methods
  - [ ] Add relationship to `App`
- [ ] **Create `Integration` model** → [Integration (User's Service Connection)](#integration-users-service-connection)
  - [ ] Implement credential encryption
  - [ ] Add webhook URL generation methods
  - [ ] Add connection testing methods
  - [ ] Define integration types constants

#### 3.2 Workflow Execution Models
- [ ] **Create `WorkflowExecution` model** → [WorkflowExecution](#workflowexecution)
  - [ ] Define status constants and transitions
  - [ ] Add execution tracking methods
- [ ] **Create `WorkflowStep` model** → [WorkflowStep](#workflowstep)
  - [ ] Add comprehensive output handling (raw response, processed output)
  - [ ] Add step tracking and retry logic with error codes
  - [ ] Define relationships to executions and nodes
  - [ ] Add template variable generation methods
- [ ] **Create `TriggerEvent` model** → [TriggerEvent](#triggerevent)
  - [ ] Define event source constants
  - [ ] Add event data processing methods
  - [ ] Define relationships to triggers and executions

#### 3.3 Enhanced Existing Models
- [ ] **Update `Sequence` model** → [Sequence (Workflow Definition)](#sequence-workflow-definition)
  - [ ] Add new fields and relationships
  - [ ] Add execution tracking methods
- [ ] **Update `Node` model** → [Node (Workflow Steps - Always Actions)](#node-workflow-steps---always-actions)
  - [ ] Add `getExecutableAction()` method
  - [ ] Define node type constants (including `child_workflow`)
  - [ ] Add integration relationships
  - [ ] **Add action group relationships** → [Enhanced Node Types for Action Groups](#enhanced-node-types-for-action-groups)
    - [ ] Add `parallelNodes()` relationship for action groups
    - [ ] Add loop and parallel action group execution logic
- [ ] **Update `Trigger` model** → [Trigger (Multiple Triggers per Sequence)](#trigger-multiple-triggers-per-sequence)
  - [ ] Add condition evaluation methods
  - [ ] Add webhook URL generation
  - [ ] Support multiple triggers per sequence

#### 3.4 Testing Framework Models
- [ ] **Create `WorkflowTest` model** → [Testing Models](#testing-models)
  - [ ] Add test execution tracking
  - [ ] Define status constants
- [ ] **Create `WorkflowStepTest` model** → [Testing Models](#testing-models)
  - [ ] Add step-by-step test tracking

### Phase 4: App Framework Development (Priority: High)

#### 4.1 Base App Classes
- [ ] **Create `BaseApp` abstract class** → [App Structure](#app-structure)
  - [ ] Define abstract methods for triggers, actions, connectors
  - [ ] Add app registration logic with logos and lookup keys
  - [ ] Add health check and testing methods
  - [ ] Add getter methods for all app metadata
- [ ] **Create `AppConnector` abstract class** → [Saloon Integration Layer](#saloon-integration-layer)
  - [ ] Extend Saloon Connector with app-specific features
  - [ ] Add credential handling and rate limiting
- [ ] **Create `ActionInterface`** → [Action Implementation](#action-implementation)
  - [ ] Define execute method contract
  - [ ] Add test execution support

#### 4.2 App Registry System
- [ ] **Create `AppRegistry` class** → [App Registry and Auto-Registration](#app-registry-and-auto-registration)
  - [ ] Add comprehensive app discovery with reflection
  - [ ] Implement auto-registration during deployment
  - [ ] Add app execution orchestration
  - [ ] Add error handling and logging for registration
  - [ ] Add database persistence for all app metadata
- [ ] **Create `RegisterAppsCommand`** → [Deployment Command](#deployment-command)
  - [ ] Artisan command for app registration
  - [ ] Add to deployment pipeline

#### 4.3 Built-in Apps
- [ ] **Create `ShopifyApp`** → [Shopify App Example](#shopify-app-example)
  - [ ] Define all triggers and actions
  - [ ] Create Saloon connector and requests
  - [ ] Add webhook handling
- [ ] **Create `WebhookApp`** → [Webhook App](#webhook-app)
  - [ ] Support universal webhook reception
  - [ ] Generate unique URLs per trigger
  - [ ] Add authentication options
- [ ] **Create `MailchimpApp`** → [Mailchimp App](#mailchimp-app)
  - [ ] Email marketing integration
  - [ ] List management actions
- [ ] **Create `SlackApp`** → [Slack App](#slack-app)
  - [ ] Messaging and notification actions
- [ ] **Create `StripeApp`** → [Stripe App](#stripe-app)
  - [ ] Payment processing integration
- [ ] **Create utility apps** → [Utility Apps](#utility-apps)
  - [ ] `SchedulerApp` for time-based triggers
  - [ ] `FilterApp` for data transformation
  - [ ] `ConditionApp` for logic operations
- [ ] **Create `KajabiApp`** → [Complete Kajabi Integration Example](#complete-kajabi-integration-example)
  - [ ] Implement "New Order" trigger with comprehensive output schema
  - [ ] Implement "Create Tag" action with full error handling
  - [ ] Add health checks and connection testing
  - [ ] Demonstrate complete workflow with template variables

### Phase 5: Workflow Execution Engine (Priority: High)

#### 5.1 Execution Engine Updates
- [ ] **Update `RunSequenceWorkflow`** → [Workflow Execution with Apps](#workflow-execution-with-apps)
  - [ ] Support multiple triggers per sequence
  - [ ] Add integration-based action execution
  - [ ] Implement conditional edge logic
  - [ ] **Enhance loop and parallel execution** → [Loop and Parallel Execution as Workflow Patterns](#loop-and-parallel-execution-as-workflow-patterns)
- [ ] **Create Action Executors** → [Node Representation](#node-representation-nodes--actions)
  - [ ] `AppActionExecutor` for external API calls with comprehensive output handling
  - [ ] `ConditionExecutor` for logical operations
  - [ ] `LoopExecutor` for iteration **with dynamic action group execution** → [Loop Execution with Dynamic Actions](#loop-execution-with-dynamic-actions)
  - [ ] `DelayExecutor` for time delays
  - [ ] `ParallelExecutor` for concurrent actions **with workflow-like patterns**
  - [ ] `MergeExecutor` for combining results
  - [ ] Add error handling and retry logic with specific error codes

#### 5.2 Data Flow & Templating
- [ ] **Enhance `TemplateResolver`** → [Template Engine Integration](#template-engine-integration)
  - [ ] Support Zapier-style variables (`{{149133970__field}}`)
  - [ ] Support friendly variables (`{{step_1.field}}`)
  - [ ] Add array notation support
  - [ ] Implement dot notation parsing
- [ ] **Create data flow system**
  - [ ] Pass step outputs to next steps
  - [ ] Maintain execution context
  - [ ] Support variable scoping

#### 5.3 Workflow Patterns
- [ ] **Implement workflow patterns** → [Workflow Patterns](#workflow-patterns)
  - [ ] Linear workflow execution
  - [ ] Conditional branching
  - [ ] Loop iteration
  - [ ] Parallel execution with merge
  - [ ] Delay/scheduling support

## Loop and Parallel Execution as Workflow Patterns

### Architecture Insight

**Child workflows are simply specialized loop or parallel execution patterns.** Rather than creating separate child workflow executors, we can achieve the same functionality through:

1. **Sequential Action Groups**: A series of actions that run one after another (like a "payment processing workflow")
2. **Parallel Action Groups**: Multiple actions that run simultaneously (like "asset processing workflow")
3. **Loop Execution**: Dynamic action groups that repeat for each item in a dataset

This simplifies the architecture while maintaining the same powerful workflow composition capabilities.

#### How Laravel Workflow Handles Complex Patterns

```php
class ProcessOrderWorkflow extends Workflow
{
    public function execute($input)
    {
        // Sequential activities
        $result1 = yield ActivityStub::make(CreateCustomerActivity::class, $input);
        
        // Parallel activities (like a "parallel action group")
        $parallelResults = yield ActivityStub::all([
            ActivityStub::make(SendEmailActivity::class, $result1),
            ActivityStub::make(CreateTagActivity::class, $result1),
            ActivityStub::make(UpdateInventoryActivity::class, $result1),
        ]);
        
        // Loop execution (like a "loop action group")
        $loopResults = [];
        foreach ($input['line_items'] as $item) {
            $loopResults[] = yield ActivityStub::make(
                ProcessLineItemActivity::class, 
                ['item' => $item, 'order_id' => $input['order_id']]
            );
        }
        
        return array_merge($parallelResults, ['loop_results' => $loopResults]);
    }
}
```

#### Simplified Implementation for Our Automation Platform

```php
<?php

namespace App\Workflows\Automation;

use App\Models\Sequence;use App\Models\WorkflowExecution;
use App\Models\WorkflowStep;
use App\Workflows\Automation\NodeActivities\ActionActivity;
use Workflow\ActivityStub;
use Workflow\Workflow;

class RunSequenceWorkflow extends Workflow
{
    public function execute(array $triggerData, Sequence $sequence)
    {
        // Create workflow execution record
        $execution = WorkflowExecution::create([
            'sequence_id' => $sequence->id,
            'trigger_data' => $triggerData,
            'status' => WorkflowExecution::STATUS_RUNNING,
            'started_at' => now(),
        ]);
        
        $currentData = $triggerData;
        $stepOutputs = [];
        
        foreach ($sequence->actions as $node) {
            // Create step record
            $step = WorkflowStep::create([
                'execution_id' => $execution->id,
                'node_id' => $node->id,
                'step_name' => $node->name ?? $node->appAction?->name,
                'input_data' => $currentData,
                'status' => WorkflowStep::STATUS_PENDING,
            ]);
            
            try {
                // Execute based on node type
                $stepResult = match($node->type) {
                    'action' => yield ActivityStub::make(
                        ActionActivity::class,
                        ['node' => $node, 'input' => $currentData, 'step' => $step]
                    ),
                    'condition' => yield ActivityStub::make(
                        ConditionActivity::class,
                        ['node' => $node, 'input' => $currentData, 'step' => $step]
                    ),
                    'loop' => yield ActivityStub::make(
                        LoopActivity::class,
                        ['node' => $node, 'input' => $currentData, 'step' => $step]
                    ),
                    'parallel' => yield ActivityStub::all(
                        $this->getParallelActivities($node, $currentData)
                    ),
                    'delay' => yield ActivityStub::make(
                        DelayActivity::class,
                        ['duration' => $node->configuration['duration'], 'step' => $step]
                    ),
                    default => throw new Exception("Unknown node type: {$node->type}")
                };
                
                // Update step with results
                $step->recordSuccess($stepResult);
                $stepOutputs[$node->id] = $stepResult;
                
                // Merge output into current data for next step
                $currentData = array_merge($currentData, [
                    "step_{$node->id}" => $stepResult,
                    $node->id => $stepResult, // Zapier-style reference
                ]);
                
            } catch (Exception $e) {
                $step->recordFailure($e->getMessage(), WorkflowStep::ERROR_EXTERNAL_SERVICE);
                $execution->update([
                    'status' => WorkflowExecution::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                    'completed_at' => now(),
                ]);
                throw $e;
            }
        }
        
        // Mark execution as completed
        $execution->update([
            'status' => WorkflowExecution::STATUS_COMPLETED,
            'completed_at' => now(),
            'duration_ms' => now()->diffInMilliseconds($execution->started_at),
        ]);
        
        return $stepOutputs;
    }
    
    private function getParallelActivities($node, $currentData): array
    {
        $activities = [];
        
        foreach ($node->parallelNodes as $parallelNode) {
            $activities[] = ActivityStub::make(
                ActionActivity::class,
                ['node' => $parallelNode, 'input' => $currentData]
            );
        }
        
        return $activities;
    }
}
```

#### Enhanced Node Types for Action Groups

```php
// Enhanced Node model
class Node extends Model
{
    protected $table = 'automation_nodes';
    
    const TYPES = [
        'action' => 'App Action',
        'condition' => 'Condition',
        'loop' => 'Loop',                     // Handles dynamic action groups
        'delay' => 'Delay',
        'parallel' => 'Parallel',             // Handles concurrent action groups
        'merge' => 'Merge',
    ];
    
    // Relationships for action groups
    public function parallelNodes() {
        return $this->hasMany(Node::class, 'parent_node_id');
    }
    
    public function getExecutableAction(): ActionInterface {
        return match($this->type) {
            'action' => new AppActionExecutor($this->integration, $this->appAction, $this->configuration),
            'condition' => new ConditionExecutor($this->configuration),
            'loop' => new LoopExecutor($this->configuration, $this->loop_actions ?? []),
            'delay' => new DelayExecutor($this->configuration),
            'parallel' => new ParallelExecutor($this->configuration, $this->parallelNodes),
            'merge' => new MergeExecutor($this->configuration),
        };
    }
}
```

#### Enhanced Parallel Executor for Action Groups

```php
<?php

namespace App\Workflows\Automation\Executors;

use App\Contracts\ActionInterface;
use App\Models\WorkflowStep;
use App\Models\Node;
use Workflow\ActivityStub;

class ParallelExecutor implements ActionInterface
{
    public function __construct(
        private array $configuration,
        private $parallelNodes = null
    ) {}
    
    public function execute(array $input, WorkflowStep $step): array
    {
        $step->recordStart();
        
        try {
            // Get parallel action configurations
            $parallelActions = $this->configuration['parallel_actions'] ?? [];
            
            if (empty($parallelActions)) {
                $step->recordSuccess(['parallel_results' => []]);
                return ['parallel_results' => []];
            }
            
            // Create ActivityStub for each parallel action
            $activities = [];
            
            foreach ($parallelActions as $actionIndex => $actionConfig) {
                $activities[] = ActivityStub::make(
                    ParallelActionActivity::class,
                    [
                        'action_config' => $actionConfig,
                        'input' => $input,
                        'step' => $step,
                        'action_index' => $actionIndex
                    ]
                );
            }
            
            // Execute all actions in parallel
            $results = yield ActivityStub::all($activities);
            
            $output = [
                'parallel_results' => $results,
                'completed_at' => now()->toISOString(),
            ];
            
            $step->recordSuccess($output);
            return $output;
            
        } catch (Exception $e) {
            $step->recordFailure(
                errorMessage: "Parallel execution failed: " . $e->getMessage(),
                errorCode: WorkflowStep::ERROR_EXTERNAL_SERVICE,
                debugInfo: [
                    'parallel_configuration' => $this->configuration,
                    'input_data' => $input,
                ]
            );
            
            throw $e;
        }
    }
    
    public function executeTest(array $input): array
    {
        $parallelActions = $this->configuration['parallel_actions'] ?? [];
        
        return [
            'parallel_results' => array_map(function($action, $index) {
                return [
                    'action_index' => $index,
                    'mock_result' => 'Parallel action executed',
                    'completed_at' => now()->toISOString()
                ];
            }, $parallelActions, array_keys($parallelActions)),
            'test_mode' => true
        ];
    }
}
```

### Loop and Parallel Execution as Workflow Patterns

#### 1. Order Processing with Sequential and Parallel Patterns
```
Main Workflow: "Process Order"
├── Trigger: New Order Created
├── Action: Validate Order
├── Sequential Action Group: "Payment Processing"
│   ├── Action: Charge Card
│   ├── Action: Send Receipt
│   └── Action: Update Payment Status
├── Parallel Action Group: "Fulfillment Tasks"
│   ├── Action: Check Inventory
│   ├── Action: Create Shipping Label
│   └── Action: Send Tracking Email
└── Action: Mark Order Complete
```

#### 2. Customer Onboarding with Parallel Execution
```
Main Workflow: "Customer Onboarding"
├── Trigger: Customer Registered
├── Parallel Execution:
│   ├── Action Group: "Email Welcome Series" (5 emails over 2 weeks)
│   ├── Action Group: "Setup Account" (create profiles, permissions)
│   └── Action Group: "Analytics Tracking" (create user events)
└── Action: Mark Onboarding Complete
```

#### 3. Content Publishing with Loop and Parallel Patterns
```
Main Workflow: "Publish Content"
├── Trigger: Content Submitted
├── Sequential Action Group: "Content Review"
│   ├── Action: Auto-check Quality
│   ├── Condition: If needs human review
│   └── Action: Notify Reviewers
├── Parallel Action Group: "Asset Processing"
│   ├── Action: Optimize Images
│   ├── Action: Generate Thumbnails
│   └── Action: Upload to CDN
└── Action: Publish to Website
```

### Testing Framework for Action Groups

#### Test Data Structure
```php
class WorkflowTestService
{
    public function testWorkflowWithActionGroups(Sequence $sequence, array $sampleTriggerData): WorkflowTest
    {
        $test = WorkflowTest::create([
            'sequence_id' => $sequence->id,
            'test_data' => $sampleTriggerData,
            'status' => WorkflowTest::STATUS_RUNNING,
            'created_by' => auth()->id(),
        ]);
        
        // Execute in test mode
        $this->executeTestWorkflowWithActionGroups($test, $sampleTriggerData);
        
        return $test;
    }
    
    private function executeTestWorkflowWithActionGroups(WorkflowTest $test, array $triggerData): void
    {
        $sequence = $test->sequence;
        $currentData = $triggerData;
        $stepOutputs = [];
        
        foreach ($sequence->nodes as $node) {
            $stepTest = WorkflowStepTest::create([
                'workflow_test_id' => $test->id,
                'node_id' => $node->id,
                'input_data' => $currentData,
                'status' => 'running',
            ]);
            
            try {
                // Execute the action based on its type
                $executor = $node->getExecutableAction();
                $output = $executor->executeTest($currentData);
                
                // For loop/parallel nodes, output includes action group results
                if ($node->type === 'loop') {
                    $output['action_group_type'] = 'loop';
                    $output['iterations'] = count($output['results'] ?? []);
                } elseif ($node->type === 'parallel') {
                    $output['action_group_type'] = 'parallel';
                    $output['parallel_actions'] = count($output['parallel_results'] ?? []);
                }
                
                $stepTest->update([
                    'output_data' => $output,
                    'status' => 'completed',
                ]);
                
                $stepId = $node->id;
                $stepOutputs[$stepId] = $output;
                $currentData = array_merge($currentData, [
                    "step_{$stepId}" => $output,
                    $stepId => $output,
                ]);
                
            } catch (Exception $e) {
                $stepTest->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
                
                $test->update(['status' => WorkflowTest::STATUS_FAILED]);
                return;
            }
        }
        
        $test->update([
            'step_outputs' => $stepOutputs,
            'status' => WorkflowTest::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }
}
```

## Basic UI Specifications for Workflow Management

### 1. Workflow Builder Interface

#### Main Workflow Canvas
```html
<!-- Workflow Builder -->
<div class="workflow-builder">
    <!-- Toolbar -->
    <div class="toolbar">
        <button class="btn-add-trigger">Add Trigger</button>
        <button class="btn-add-action">Add Action</button>
        <button class="btn-add-loop">Add Loop</button>
        <button class="btn-add-parallel">Add Parallel</button>
        <button class="btn-test-workflow">Test Workflow</button>
        <button class="btn-save">Save</button>
    </div>
    
    <!-- Canvas -->
    <div class="canvas" id="workflow-canvas">
        <!-- Nodes will be rendered here -->
    </div>
    
    <!-- Properties Panel -->
    <div class="properties-panel">
        <div id="node-properties">
            <!-- Selected node properties -->
        </div>
    </div>
</div>
```

#### Node Forms

##### Trigger Form
```html
<form class="trigger-form">
    <div class="form-group">
        <label>Trigger Name</label>
        <input type="text" name="name" placeholder="e.g., New Order Created">
    </div>
    
    <div class="form-group">
        <label>Integration</label>
        <select name="integration_id">
            <option value="">Select Integration</option>
            <option value="1">Shopify - Main Store</option>
            <option value="2">Kajabi - Course Platform</option>
        </select>
    </div>
    
    <div class="form-group">
        <label>Trigger Type</label>
        <select name="app_trigger_id">
            <option value="">Select Trigger</option>
            <option value="1">Order Created</option>
            <option value="2">Customer Created</option>
        </select>
    </div>
    
    <div class="form-group">
        <label>Conditions (Optional)</label>
        <div class="conditions-builder">
            <div class="condition-row">
                <select name="conditions[0][field]">
                    <option value="order_total">Order Total</option>
                    <option value="customer_tags">Customer Tags</option>
                </select>
                <select name="conditions[0][operator]">
                    <option value="gt">Greater Than</option>
                    <option value="contains">Contains</option>
                </select>
                <input type="text" name="conditions[0][value]" placeholder="Value">
            </div>
            <button type="button" class="btn-add-condition">Add Condition</button>
        </div>
    </div>
    
    <button type="submit">Save Trigger</button>
</form>
```

##### Action Form
```html
<form class="action-form">
    <div class="form-group">
        <label>Action Name</label>
        <input type="text" name="name" placeholder="e.g., Create Customer Tag">
    </div>
    
    <div class="form-group">
        <label>Integration</label>
        <select name="integration_id">
            <option value="">Select Integration</option>
            <option value="1">Kajabi - Course Platform</option>
            <option value="2">Mailchimp - Email Marketing</option>
        </select>
    </div>
    
    <div class="form-group">
        <label>Action Type</label>
        <select name="app_action_id">
            <option value="">Select Action</option>
            <option value="1">Create Tag</option>
            <option value="2">Add Member Tag</option>
        </select>
    </div>
    
    <div class="form-group">
        <label>Configuration</label>
        <div class="configuration-fields">
            <!-- Dynamic fields based on selected action -->
            <div class="field-group">
                <label>Tag Name</label>
                <input type="text" name="configuration[name]" 
                       placeholder="Use {{trigger.product_name}} for dynamic values">
                <div class="template-helper">
                    <small>Available variables: {{trigger.product_name}}, {{step_1.customer_id}}</small>
                </div>
            </div>
            
            <div class="field-group">
                <label>Tag Color</label>
                <input type="color" name="configuration[color]" value="#3B82F6">
            </div>
        </div>
    </div>
    
    <button type="submit">Save Action</button>
</form>
```

##### Loop Action Group Form
```html
<form class="loop-form">
    <div class="form-group">
        <label>Node Name</label>
        <input type="text" name="name" placeholder="e.g., Process Each Line Item">
    </div>
    
    <div class="form-group">
        <label>Loop Over</label>
        <input type="text" name="loop_over" placeholder="{{trigger.line_items}}">
        <small>Array or list to iterate over</small>
    </div>
    
    <div class="form-group">
        <label>Loop Variable Name</label>
        <input type="text" name="loop_variable" placeholder="item" value="item">
        <small>Variable name for current item (e.g., {{item.product_id}})</small>
    </div>
    
    <div class="form-group">
        <label>Max Iterations</label>
        <input type="number" name="max_iterations" value="100" min="1" max="1000">
        <small>Safety limit for loop iterations</small>
    </div>
    
    <div class="form-group">
        <label>Execution Mode</label>
        <select name="parallel">
            <option value="false">Sequential (one at a time)</option>
            <option value="true">Parallel (all at once)</option>
        </select>
    </div>
    
    <div class="form-group">
        <label>Loop Actions</label>
        <div class="loop-actions-builder">
            <div class="action-template">
                <select name="loop_actions[0][action_type]">
                    <option value="app_action">App Action</option>
                    <option value="condition">Condition</option>
                    <option value="delay">Delay</option>
                </select>
                <button type="button" class="btn-configure-action">Configure</button>
            </div>
            <button type="button" class="btn-add-loop-action">Add Action</button>
        </div>
    </div>
    
    <button type="submit">Save Loop</button>
</form>
```

### 2. Workflow Testing Interface

#### Test Workflow Form
```html
<form class="test-workflow-form">
    <h3>Test Workflow: {{workflow.name}}</h3>
    
    <div class="form-group">
        <label>Test Name</label>
        <input type="text" name="test_name" placeholder="e.g., Test with Sample Order Data">
    </div>
    
    <div class="form-group">
        <label>Trigger Data (JSON)</label>
        <textarea name="trigger_data" rows="10" placeholder='{
  "order_id": "12345",
  "customer_email": "test@example.com",
  "product_name": "Advanced Course",
  "order_total": 29700
}'></textarea>
        <div class="json-helper">
            <button type="button" class="btn-load-sample">Load Sample Data</button>
            <button type="button" class="btn-validate-json">Validate JSON</button>
        </div>
    </div>
    
    <button type="submit">Run Test</button>
</form>
```

#### Test Results Display
```html
<div class="test-results">
    <div class="test-header">
        <h3>Test Results: {{test.test_name}}</h3>
        <span class="status-badge status-{{test.status}}">{{test.status}}</span>
        <span class="duration">Duration: {{test.duration_ms}}ms</span>
    </div>
    
    <div class="step-results">
        <!-- For each step -->
        <div class="step-result" data-step-id="{{step.node_id}}">
            <div class="step-header">
                <h4>{{step.step_name}}</h4>
                <span class="status-badge status-{{step.status}}">{{step.status}}</span>
                <span class="duration">{{step.execution_time_ms}}ms</span>
            </div>
            
            <div class="step-content">
                <div class="step-input">
                    <h5>Input Data</h5>
                    <pre>{{step.input_data | json}}</pre>
                </div>
                
                <div class="step-output">
                    <h5>Output Data</h5>
                    <pre>{{step.output_data | json}}</pre>
                </div>
                
                <!-- If loop or parallel action group -->
                @if(step.action_group_type)
                <div class="action-group-results">
                    <h5>{{step.action_group_type === 'loop' ? 'Loop' : 'Parallel'}} Action Group Results</h5>
                    @if(step.action_group_type === 'loop')
                        <p>Iterations: {{step.iterations}}</p>
                    @else
                        <p>Parallel Actions: {{step.parallel_actions}}</p>
                    @endif
                </div>
                @endif
                
                @if(step.error_message)
                <div class="step-error">
                    <h5>Error</h5>
                    <pre>{{step.error_message}}</pre>
                </div>
                @endif
            </div>
        </div>
    </div>
    
    <div class="available-variables">
        <h3>Available Template Variables</h3>
        <div class="variable-groups">
            <div class="variable-group">
                <h4>Trigger Variables</h4>
                <ul>
                    <li><code>{{trigger.order_id}}</code> = "12345"</li>
                    <li><code>{{trigger.customer_email}}</code> = "test@example.com"</li>
                </ul>
            </div>
            
            <!-- For each step -->
            <div class="variable-group">
                <h4>Step {{step.node_id}} Variables</h4>
                <ul>
                    <li><code>{{{{step.node_id}}__tag_id}}</code> = "tag_abc123" (Zapier-style)</li>
                    <li><code>{{step_{{step.node_id}}.tag_id}}</code> = "tag_abc123" (Friendly)</li>
                </ul>
            </div>
        </div>
    </div>
</div>
```

### 3. Integration Management Interface

#### Integration List
```html
<div class="integrations-page">
    <div class="page-header">
        <h2>Integrations</h2>
        <button class="btn-add-integration">Add Integration</button>
    </div>
    
    <div class="integrations-grid">
        <!-- For each integration -->
        <div class="integration-card">
            <div class="integration-header">
                <img src="{{integration.app.logo_url}}" alt="{{integration.app.name}}" class="app-logo">
                <div class="integration-info">
                    <h3>{{integration.name}}</h3>
                    <p>{{integration.app.name}} - {{integration.type}}</p>
                </div>
                <span class="status-badge status-{{integration.is_active ? 'active' : 'inactive'}}">
                    {{integration.is_active ? 'Active' : 'Inactive'}}
                </span>
            </div>
            
            <div class="integration-actions">
                <button class="btn-test">Test Connection</button>
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
            </div>
            
            @if(integration.webhook_url)
            <div class="webhook-info">
                <label>Webhook URL:</label>
                <input type="text" value="{{integration.webhook_url}}" readonly>
                <button class="btn-copy">Copy</button>
            </div>
            @endif
        </div>
    </div>
</div>
```

#### Add Integration Form
```html
<form class="add-integration-form">
    <div class="form-step" data-step="1">
        <h3>Select App</h3>
        <div class="apps-grid">
            <!-- For each app -->
            <div class="app-card" data-app-id="{{app.id}}">
                <img src="{{app.logo_url}}" alt="{{app.name}}" class="app-logo">
                <h4>{{app.name}}</h4>
                <p>{{app.description}}</p>
                <span class="category">{{app.category}}</span>
            </div>
        </div>
    </div>
    
    <div class="form-step" data-step="2" style="display: none;">
        <h3>Configure Integration</h3>
        
        <div class="form-group">
            <label>Integration Name</label>
            <input type="text" name="name" placeholder="e.g., Main Store, Personal Account">
        </div>
        
        <div class="form-group">
            <label>Integration Type</label>
            <select name="type">
                <option value="api">API Integration</option>
                <option value="webhook">Webhook Integration</option>
                <option value="oauth">OAuth Integration</option>
            </select>
        </div>
        
        <!-- Dynamic credentials fields based on selected app -->
        <div class="credentials-section">
            <h4>Credentials</h4>
            <!-- Will be populated based on app.credentials_schema -->
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn-back">Back</button>
            <button type="button" class="btn-test-credentials">Test Connection</button>
            <button type="submit">Create Integration</button>
        </div>
    </div>
</form>
```

### 4. Database Schema Updates for Action Groups

```sql
-- Add action group support to automation_nodes
ALTER TABLE automation_nodes ADD COLUMN (
    loop_actions JSON NULL,           -- Template of actions to execute per iteration
    parallel_actions JSON NULL,      -- Configuration for parallel action execution
    parent_node_id BIGINT NULL,       -- For parallel nodes grouping
    
    INDEX idx_parent_node (parent_node_id),
    FOREIGN KEY (parent_node_id) REFERENCES automation_nodes(id)
);

-- Add action group tracking to workflow_steps
ALTER TABLE workflow_steps ADD COLUMN (
    action_group_type VARCHAR(50) NULL,  -- 'loop' or 'parallel'
    action_group_iteration INT NULL,     -- Which iteration (for loops)
    action_group_index INT NULL,         -- Which action within the group
    
    INDEX idx_action_group (action_group_type)
);
```

This simplified architecture shows how loop and parallel execution patterns can handle complex automation scenarios without requiring separate child workflow management.

### Phase 5: Testing Framework (Priority: High)

#### 5.1 Test Service
- [ ] **Create `WorkflowTestService`** → [Testing Process](#testing-process)
  - [ ] Test workflow execution with sample data
  - [ ] Capture step inputs and outputs
  - [ ] Generate template variable mappings
  - [ ] **Add loop and parallel execution testing** → [Testing Framework for Action Groups](#testing-framework-for-action-groups)
    - [ ] Test loop execution with sample data
    - [ ] Test parallel execution groups
    - [ ] Generate variables for loop and parallel outputs
- [ ] **Add test mode to action executors**
  - [ ] Mock external API calls
  - [ ] Return realistic test data
  - [ ] Track execution without side effects
  - [ ] **Add loop and parallel executor test modes**

#### 5.2 Variable Generation
- [ ] **Create variable mapping system** → [Testing Process](#testing-process)
  - [ ] Generate Zapier-style variables
  - [ ] Generate friendly variable names
  - [ ] Support nested object and array access
  - [ ] Create variable documentation

### Phase 6: API Development (Priority: High)

#### 6.1 App Management API
- [ ] **Create App endpoints** → [App Management API](#app-management-api)
  - [ ] `GET /api/apps` - List all apps
  - [ ] `GET /api/apps/{app_key}` - Get app details
  - [ ] `POST /api/integrations` - Create integration
  - [ ] `GET /api/integrations` - List integrations
  - [ ] `POST /api/integrations/{id}/test` - Test connection

#### 6.2 Workflow Management API
- [ ] **Create Workflow endpoints** → [Workflow Management API](#workflow-management-api)
  - [ ] `POST /api/workflows` - Create workflow
  - [ ] `PUT /api/workflows/{id}` - Update workflow
  - [ ] `POST /api/workflows/{id}/execute` - Execute workflow
  - [ ] `GET /api/workflows/{id}/executions` - List executions
  - [ ] `GET /api/workflows/{id}/analytics` - Get analytics

#### 6.3 Testing API
- [ ] **Create Testing endpoints** → [Testing API](#testing-api)
  - [ ] `POST /api/workflows/{id}/test` - Start test
  - [ ] `GET /api/workflows/{id}/tests/{test_id}` - Get test results
  - [ ] `GET /api/workflows/{id}/variables` - Get available variables

#### 6.4 Template API
- [ ] **Create Template endpoints** → [Workflow Template API](#workflow-template-api)
  - [ ] `GET /api/workflow-templates` - List templates
  - [ ] `POST /api/workflows/from-template` - Create from template
  - [ ] `POST /api/workflow-templates` - Create template

### Phase 7: Webhook System (Priority: High)

#### 7.1 Webhook Infrastructure
- [ ] **Create webhook routes** → [Webhook URL Generation](#webhook-url-generation)
  - [ ] Organization-scoped URLs
  - [ ] Integration-specific URLs
  - [ ] Trigger-specific URLs
- [ ] **Create `WebhookController`**
  - [ ] Handle incoming webhooks
  - [ ] Validate webhook signatures
  - [ ] Log all trigger events
  - [ ] Route to appropriate triggers
- [ ] **Create trigger event processing**
  - [ ] Handle multiple event sources (webhook, API, schedule, manual)
  - [ ] Process event data and metadata
  - [ ] Evaluate trigger conditions
  - [ ] Initiate workflow executions

#### 7.2 Webhook Management
- [ ] **Create webhook management UI**
  - [ ] Display generated URLs
  - [ ] Show trigger event logs
  - [ ] Test webhook endpoints
- [ ] **Add webhook authentication**
  - [ ] API key validation
  - [ ] Signature verification
  - [ ] Custom header support

### Phase 8: Frontend Integration (Priority: Medium)

#### 8.1 Workflow Builder UI
- [ ] **Update workflow builder** → [Enhanced Workflow Models](#enhanced-workflow-models)
  - [ ] Support multiple triggers per workflow
  - [ ] Integration selection for nodes
  - [ ] Condition builder for triggers
  - [ ] Visual node positioning
  - [ ] **Add loop and parallel action group support** → [Basic UI Specifications for Workflow Management](#basic-ui-specifications-for-workflow-management)
    - [ ] Loop node type with action group builder
    - [ ] Parallel node type with concurrent action configuration
    - [ ] Visual representation of action groups
    - [ ] Loop configuration interface (iteration variable, conditions)
- [ ] **Add app marketplace**
  - [ ] Display available apps
  - [ ] Integration setup wizard
  - [ ] App-specific configuration forms

#### 8.2 Integration Management UI
- [ ] **Create integration pages**
  - [ ] List user's integrations
  - [ ] Add/edit integration forms
  - [ ] Test connection interface
  - [ ] Webhook URL display

#### 8.3 Testing Interface
- [ ] **Create workflow testing UI** → [Workflow Testing Interface](#workflow-testing-interface)
  - [ ] Test workflow with sample data
  - [ ] Display step-by-step results
  - [ ] Show available variables
  - [ ] Variable usage examples
  - [ ] **Add loop and parallel testing UI**
    - [ ] Loop iteration result display
    - [ ] Parallel action group result display
    - [ ] Action group variable display
    - [ ] Iteration-specific variable scoping

### Phase 9: Security & Performance (Priority: Medium)

#### 9.1 Security Implementation
- [ ] **Implement security measures** → [Security Considerations](#security-considerations)
  - [ ] Encrypt sensitive credentials


#### 9.2 Performance Optimization
- [ ] **Optimize database queries**
  - [ ] Add missing indexes
  - [ ] Optimize N+1 queries
  - [ ] Implement query caching
- [ ] **Add performance monitoring**
  - [ ] Execution time tracking
  - [ ] Error rate monitoring
  - [ ] Resource usage tracking

### Phase 10: Testing & Quality Assurance (Priority: Medium)

#### 10.1 Test Suite Development
- [ ] **Create comprehensive tests** → [Testing Strategy](#testing-strategy)
  - [ ] Unit tests for all models
  - [ ] Integration tests for workflows
  - [ ] API endpoint tests
  - [ ] Performance tests
- [ ] **Add test data factories**
  - [ ] Factory for all new models
  - [ ] Realistic test data generation
  - [ ] Test scenario builders

#### 10.2 Quality Assurance
- [ ] **Code quality checks**
  - [ ] Static analysis with PHPStan
  - [ ] Code style enforcement
  - [ ] Security vulnerability scanning
- [ ] **Performance testing**
  - [ ] Load testing for workflows
  - [ ] API endpoint benchmarks
  - [ ] Database performance tests

### Phase 11: Documentation & Deployment (Priority: Low)

#### 11.1 Documentation
- [ ] **Create developer documentation**
  - [ ] App development guide
  - [ ] API documentation
  - [ ] Workflow patterns guide
- [ ] **Create user documentation**
  - [ ] Integration setup guides
  - [ ] Workflow creation tutorials
  - [ ] Troubleshooting guides

#### 11.2 Deployment Pipeline
- [ ] **Set up deployment automation**
  - [ ] Auto-register apps on deploy
  - [ ] Database migration automation
  - [ ] Environment-specific configuration
- [ ] **Add monitoring and alerts**
  - [ ] System health monitoring
  - [ ] Error alerting
  - [ ] Performance dashboards

### Success Criteria & Validation

#### 11.3 Success Metrics Implementation
- [ ] **Implement tracking** → [Success Metrics](#success-metrics)
  - [ ] Monthly active workflows tracking
  - [ ] Workflow completion rate monitoring
  - [ ] User retention analytics
  - [ ] Performance benchmarks
- [ ] **Create analytics dashboard**
  - [ ] Real-time workflow statistics
  - [ ] User engagement metrics
  - [ ] System performance indicators

### Dependencies & Prerequisites

#### Critical Dependencies
- [ ] **Laravel Workflow package** - Already installed
- [ ] **Saloon HTTP client** - Need to install
- [ ] **Queue system** - Configure for background processing
- [ ] **Database optimization** - Ensure proper indexing

#### Order of Implementation
1. **Database Foundation** (Phase 1) - Must be completed first
2. **Core Models** (Phase 2) - Depends on database
3. **App Framework** (Phase 3) - Depends on models
4. **Execution Engine** (Phase 4) - Depends on app framework
5. **Testing Framework** (Phase 5) - Can be parallel with execution
6. **API Development** (Phase 6) - Depends on execution engine
7. **Webhook System** (Phase 7) - Can be parallel with API
8. **Frontend Integration** (Phase 8) - Depends on API
9. **Security & Performance** (Phase 9) - Ongoing throughout
10. **Testing & QA** (Phase 10) - Ongoing throughout
11. **Documentation** (Phase 11) - Can be parallel with development

---

## Executive Summary

**Vision**: Build the most powerful automation platform for commerce, combining the simplicity of Zapier with advanced e-commerce-specific features like inventory management, customer lifecycle automation, and multi-channel orchestration.

**Key Differentiators**:
- Commerce-native triggers and actions
- Advanced workflow control (loops, conditions, delays, parallel execution)
- Deep integration with commerce platforms (Shopify, WooCommerce, BigCommerce)
- Built-in analytics and performance monitoring
- Multi-organization support with role-based access

## Current Architecture

### Laravel Workflow Foundation

We leverage the **laravel-workflow/laravel-workflow** package as our execution engine, providing:

#### Core Workflow Tables
- **workflows**: Main workflow execution instances
- **workflow_logs**: Detailed execution step tracking
- **workflow_signals**: Signal handling for workflow communication
- **workflow_timers**: Scheduling and delayed execution
- **workflow_exceptions**: Error handling and recovery
- **workflow_relationships**: Workflow execution relationships and dependencies

#### Custom Automation Layer
- **automation_sequences**: User-defined workflow templates
- **automation_triggers**: Event-based workflow initiators
- **automation_nodes**: Individual workflow steps/actions
- **automation_edges**: Connections between workflow nodes

#### Event System
- **resource_events**: Change tracking for all models (CRUD operations)

### Current Implementation Status

#### ✅ Implemented
- Basic workflow execution engine
- Visual workflow builder foundation
- Email and webhook activities
- Template resolution system
- Event-driven triggers
- Multi-organization support

#### 🚧 In Progress
- Advanced node types (conditions, loops)
- Integration framework
- Performance monitoring

#### 📋 Planned
- Advanced workflow patterns
- Comprehensive integration ecosystem
- Enterprise features

### Existing Files and Their Current State

#### Migrations
- **`database/migrations/2025_04_21_040651_create_workflow_tables.php`** - Creates basic automation tables
- **`database/migrations/2025_04_27_015811_create_resource_events_table.php`** - Creates resource event tracking
- **`database/migrations/2022_01_01_000000_create_workflows_table.php`** - Laravel Workflow base tables
- **`database/migrations/2022_01_01_000001_create_workflow_logs_table.php`** - Workflow logging
- **`database/migrations/2022_01_01_000002_create_workflow_signals_table.php`** - Workflow signals
- **`database/migrations/2022_01_01_000003_create_workflow_timers_table.php`** - Workflow timers
- **`database/migrations/2022_01_01_000004_create_workflow_exceptions_table.php`** - Workflow exceptions
- **`database/migrations/2022_01_01_000005_create_workflow_relationships_table.php`** - Workflow relationships

#### Models
- **`app/Models/Automation/Sequence.php`** - Current: Basic sequence model with hasMany relationships
- **`app/Models/Automation/Trigger.php`** - Current: Basic trigger with event_name and morphs target
- **`app/Models/Automation/Node.php`** - Current: Basic node with type and arguments
- **`app/Models/Automation/Edge.php`** - Current: Basic edge with from/to node relationships
- **`app/Models/Automation/StoredWorkflow.php`** - Current: Extends Laravel Workflow base
- **`app/Models/ResourceEvent.php`** - Current: Event tracking with action, subject, snapshot

#### Workflow Activities
- **`app/Workflows/Automation/WebhookActivity.php`** - Current: HTTP request activity with template resolution
- **`app/Workflows/Automation/EmailActivity.php`** - Current: Email sending activity
- **`app/Workflows/Automation/TemplateResolver.php`** - Current: Basic template resolution for trigger data
- **`app/Workflows/RunSequenceWorkflow.php`** - Current: Basic workflow execution

#### What Needs to Change

**Migrations Required:**
1. Add new tables: `apps`, `app_triggers`, `app_actions`, `integrations`, `workflow_tests`, `workflow_step_tests`, `webhook_requests`, `workflow_executions`, `workflow_steps`
2. Modify existing tables:
   - `automation_sequences`: Add description, is_active, metadata, settings, created_by, etc.
   - `automation_triggers`: Replace event_name/target with integration_id/app_trigger_id, add conditions, webhook_url
   - `automation_nodes`: Replace arguments with integration_id/app_action_id/configuration, add position, metadata
   - `automation_edges`: Add conditions, metadata

**Models Required:**
1. **New Models**: `App`, `AppTrigger`, `AppAction`, `Integration`, `WorkflowTest`, `WorkflowStepTest`, `WebhookRequest`, `WorkflowExecution`, `WorkflowStep`
2. **Enhanced Models**: Update existing models with new fields and relationships

**Architecture Changes:**
- Move from simple event_name triggers to App-based triggers
- Add Integration abstraction layer
- Implement test framework for workflow debugging
- Add webhook URL generation and handling
- Enhance template resolution for multiple variable formats

### Existing Files and Their Current State

#### Migrations
- **`database/migrations/2025_04_21_040651_create_workflow_tables.php`** - Creates basic automation tables
- **`database/migrations/2025_04_27_015811_create_resource_events_table.php`** - Creates resource event tracking
- **`database/migrations/2022_01_01_000000_create_workflows_table.php`** - Laravel Workflow base tables
- **`database/migrations/2022_01_01_000001_create_workflow_logs_table.php`** - Workflow logging
- **`database/migrations/2022_01_01_000002_create_workflow_signals_table.php`** - Workflow signals
- **`database/migrations/2022_01_01_000003_create_workflow_timers_table.php`** - Workflow timers
- **`database/migrations/2022_01_01_000004_create_workflow_exceptions_table.php`** - Workflow exceptions
- **`database/migrations/2022_01_01_000005_create_workflow_relationships_table.php`** - Workflow relationships

#### Models
- **`app/Models/Automation/Sequence.php`** - Current: Basic sequence model with hasMany relationships
- **`app/Models/Automation/Trigger.php`** - Current: Basic trigger with event_name and morphs target
- **`app/Models/Automation/Node.php`** - Current: Basic node with type and arguments
- **`app/Models/Automation/Edge.php`** - Current: Basic edge with from/to node relationships
- **`app/Models/Automation/StoredWorkflow.php`** - Current: Extends Laravel Workflow base
- **`app/Models/ResourceEvent.php`** - Current: Event tracking with action, subject, snapshot

#### Workflow Activities
- **`app/Workflows/Automation/WebhookActivity.php`** - Current: HTTP request activity with template resolution
- **`app/Workflows/Automation/EmailActivity.php`** - Current: Email sending activity
- **`app/Workflows/Automation/TemplateResolver.php`** - Current: Basic template resolution for trigger data
- **`app/Workflows/RunSequenceWorkflow.php`** - Current: Basic workflow execution

#### What Needs to Change

**Migrations Required:**
1. Add new tables: `apps`, `app_triggers`, `app_actions`, `integrations`, `workflow_tests`, `workflow_step_tests`, `webhook_requests`, `workflow_executions`, `workflow_steps`
2. Modify existing tables:
   - `automation_sequences`: Add description, is_active, metadata, settings, created_by, etc.
   - `automation_triggers`: Replace event_name/target with integration_id/app_trigger_id, add conditions, webhook_url
   - `automation_nodes`: Replace arguments with integration_id/app_action_id/configuration, add position, metadata
   - `automation_edges`: Add conditions, metadata

**Models Required:**
1. **New Models**: `App`, `AppTrigger`, `AppAction`, `Integration`, `WorkflowTest`, `WorkflowStepTest`, `WebhookRequest`, `WorkflowExecution`, `WorkflowStep`
2. **Enhanced Models**: Update existing models with new fields and relationships

**Architecture Changes:**
- Move from simple event_name triggers to App-based triggers
- Add Integration abstraction layer
- Implement test framework for workflow debugging
- Add webhook URL generation and handling
- Enhance template resolution for multiple variable formats

## Architecture Overview

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend (React)  │    │   Laravel Backend   │    │   External APIs     │
│                     │    │                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Workflow Builder│ │    │ │ Automation API  │ │    │ │ Shopify         │ │
│ │                 │ │    │ │                 │ │    │ │ WooCommerce     │ │
│ │ - Drag & Drop   │ │    │ │ - Triggers      │ │    │ │ Email Services  │ │
│ │ - Templates     │ │    │ │ - Actions       │ │    │ │ Payment Gateways│ │
│ │ - Testing       │ │    │ │ - Conditions    │ │    │ │ Analytics       │ │
│ └─────────────────┘ │    │ │ - Loops         │ │    │ └─────────────────┘ │
│                     │    │ └─────────────────┘ │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                      │
                            ┌─────────────────────┐
                            │   Saloon HTTP       │
                            │   Integration       │
                            │   Framework         │
                            └─────────────────────┘
```

## App-Based Architecture

### Core Concept: Apps as Integration Units

Following the Temporal/Laravel Workflow model, each integration becomes an **App** that exposes specific **triggers** and **actions**. A workflow step links to an **App + Action** combination, creating a modular and extensible system.

```
Workflow Step = App + Action/Trigger + Configuration
```

### Enhanced Data Models

#### App (Integration Definition)
```php
class App extends Model {
    protected $fillable = [
        'organization_id',
        'app_key',           // unique identifier (e.g., 'shopify', 'mailchimp')
        'name',              // display name
        'description',
        'icon_url',
        'category',
        'version',
        'is_active',
        'is_public',         // available to all orgs
        'credentials_schema', // JSON schema for required credentials
        'webhook_config',
        'rate_limits',
        'settings'
    ];
    
    protected $casts = [
        'credentials_schema' => 'json',
        'webhook_config' => 'json',
        'rate_limits' => 'json',
        'settings' => 'json',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
    ];
    
    // Relationships
    public function triggers() { return $this->hasMany(AppTrigger::class); }
    public function actions() { return $this->hasMany(AppAction::class); }
    public function connections() { return $this->hasMany(AppConnection::class); }
}
```

#### AppTrigger (Available Triggers per App)
```php
class AppTrigger extends Model {
    protected $fillable = [
        'app_id',
        'trigger_key',       // unique within app (e.g., 'order_created')
        'name',              // display name
        'description',
        'input_schema',      // JSON schema for trigger configuration
        'output_schema',     // JSON schema for trigger output data
        'webhook_events',    // webhook events that fire this trigger
        'polling_config',    // for polling-based triggers
        'is_active'
    ];
    
    protected $casts = [
        'input_schema' => 'json',
        'output_schema' => 'json',
        'webhook_events' => 'json',
        'polling_config' => 'json',
        'is_active' => 'boolean',
    ];
}
```

#### AppAction (Available Actions per App)
```php
class AppAction extends Model {
    protected $fillable = [
        'app_id',
        'action_key',        // unique within app (e.g., 'create_customer')
        'name',              // display name
        'description',
        'input_schema',      // JSON schema for action configuration
        'output_schema',     // JSON schema for action output data
        'http_config',       // HTTP request configuration
        'retry_config',
        'timeout_seconds',
        'is_active'
    ];
    
    protected $casts = [
        'input_schema' => 'json',
        'output_schema' => 'json',
        'http_config' => 'json',
        'retry_config' => 'json',
        'is_active' => 'boolean',
    ];
}
```

#### Integration (User's Service Connection)
```php
class Integration extends Model {
    protected $fillable = [
        'organization_id',
        'app_id',
        'name',              // user-defined name (e.g., "Main Store", "Personal Shopify")
        'type',              // 'api', 'webhook', 'oauth', 'custom'
        'credentials',       // encrypted credentials (API keys, OAuth tokens, etc.)
        'webhook_url',       // generated webhook URL for this integration
        'webhook_secret',    // secret for webhook verification
        'connection_config', // connection-specific configuration
        'is_active',
        'last_sync_at',
        'sync_errors',
        'settings'
    ];
    
    protected $casts = [
        'credentials' => 'encrypted:json',
        'connection_config' => 'json',
        'is_active' => 'boolean',
        'last_sync_at' => 'datetime',
        'sync_errors' => 'json',
        'settings' => 'json',
    ];
    
    // Integration types
    const TYPE_API = 'api';           // Standard API integration with credentials
    const TYPE_WEBHOOK = 'webhook';   // Webhook-based integration
    const TYPE_OAUTH = 'oauth';       // OAuth-based integration
    const TYPE_CUSTOM = 'custom';     // Custom integration type
    
    // Relationship to app
    public function app() { return $this->belongsTo(App::class); }
    
    // Generate webhook URL for this integration
    public function generateWebhookUrl(): string {
        return route('webhooks.integration', [
            'organization' => $this->organization_id,
            'integration' => $this->id,
            'token' => $this->webhook_secret
        ]);
    }
    
    // Test the integration connection
    public function testConnection(): array {
        return match($this->type) {
            self::TYPE_API => $this->testApiConnection(),
            self::TYPE_WEBHOOK => $this->testWebhookConnection(),
            self::TYPE_OAUTH => $this->testOAuthConnection(),
            default => ['success' => false, 'message' => 'Unknown integration type']
        };
    }
}
```

### Enhanced Workflow Models

#### Sequence (Workflow Definition)
```php
class Sequence extends Model {
    protected $table = 'automation_sequences';
    protected $fillable = ['organization_id', 'name', 'description'];
    
    protected $casts = [
        'metadata' => 'json',
        'settings' => 'json',
        'is_active' => 'boolean',
        'is_template' => 'boolean',
    ];
    
    // A sequence can have multiple triggers of the same type with different filters
    public function triggers() { return $this->hasMany(Trigger::class); }
    public function nodes() { return $this->hasMany(Node::class); }
    public function edges() { return $this->hasMany(Edge::class); }
    public function executions() { return $this->hasMany(WorkflowExecution::class); }
}
```

#### Node (Workflow Steps - Always Actions)
```php
class Node extends Model {
    protected $table = 'automation_nodes';
    protected $fillable = [
        'sequence_id', 
        'type',               // action, condition, loop, delay, parallel, merge
        'integration_id',     // links to user's integration
        'app_action_id',      // links to specific app action
        'configuration',      // action-specific configuration
        'position',           // x, y coordinates for visual editor
        'metadata'
    ];
    
    protected $casts = [
        'configuration' => 'json',
        'metadata' => 'json',
        'position' => 'json',
    ];
    
    // Node types - all represent actions of different kinds
    const TYPES = [
        'action' => 'App Action',      // Execute an app action
        'condition' => 'Condition',    // Conditional logic action
        'loop' => 'Loop',              // Loop control action
        'delay' => 'Delay',            // Wait/delay action
        'parallel' => 'Parallel',      // Parallel execution action
        'merge' => 'Merge',            // Merge parallel results action
    ];
    
    // Relationships
    public function integration() { return $this->belongsTo(Integration::class); }
    public function appAction() { return $this->belongsTo(AppAction::class); }
    public function sequence() { return $this->belongsTo(Sequence::class); }
    
    // How a node knows what it represents
    public function getExecutableAction(): ActionInterface {
        return match($this->type) {
            'action' => new AppActionExecutor($this->integration, $this->appAction, $this->configuration),
            'condition' => new ConditionExecutor($this->configuration),
            'loop' => new LoopExecutor($this->configuration),
            'delay' => new DelayExecutor($this->configuration),
            'parallel' => new ParallelExecutor($this->configuration),
            'merge' => new MergeExecutor($this->configuration),
        };
    }
}
```

#### Trigger (Multiple Triggers per Sequence)
```php
class Trigger extends Model {
    protected $table = 'automation_triggers';
    protected $fillable = [
        'sequence_id',
        'integration_id',     // links to user's integration
        'app_trigger_id',     // links to specific app trigger
        'name',               // user-defined name (e.g., "Premium Order Created")
        'configuration',      // trigger-specific configuration
        'conditions',         // filter conditions (e.g., offer filters)
        'webhook_url',        // generated webhook URL (for webhook triggers)
        'is_active'
    ];
    
    protected $casts = [
        'configuration' => 'json',
        'conditions' => 'json',
        'is_active' => 'boolean',
    ];
    
    // Relationships
    public function integration() { return $this->belongsTo(Integration::class); }
    public function appTrigger() { return $this->belongsTo(AppTrigger::class); }
    public function sequence() { return $this->belongsTo(Sequence::class); }
    
    // Example: Multiple triggers for same sequence
    // Trigger 1: "Premium Order Created" - filters for offers > $100
    // Trigger 2: "VIP Order Created" - filters for VIP customer offers
    // Both trigger the same workflow but with different conditions
    
    public function shouldTrigger(array $eventData): bool {
        // Check if event data matches this trigger's conditions
        return $this->evaluateConditions($eventData);
    }
    
    // Generate webhook URL for webhook-type triggers
    public function generateWebhookUrl(): string {
        if ($this->appTrigger && $this->appTrigger->trigger_key === 'webhook') {
            return route('webhooks.trigger', [
                'organization' => $this->sequence->organization_id,
                'trigger' => $this->id,
                'token' => Str::random(32)
            ]);
        }
        
        return $this->integration->generateWebhookUrl();
    }
    
    private function evaluateConditions(array $eventData): bool {
        // Example condition evaluation
        if (!$this->conditions) {
            return true;
        }
        
        foreach ($this->conditions as $field => $condition) {
            if (!$this->evaluateCondition($eventData, $field, $condition)) {
                return false;
            }
        }
        
        return true;
    }
}
```

### Workflow Execution Models

#### WorkflowExecution
```php
class WorkflowExecution extends Model {
    protected $fillable = [
        'sequence_id',
        'trigger_data',
        'status',
        'started_at',
        'completed_at',
        'error_message',
        'metadata'
    ];
    
    protected $casts = [
        'trigger_data' => 'json',
        'metadata' => 'json',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
    
    const STATUS_PENDING = 'pending';
    const STATUS_RUNNING = 'running';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_PAUSED = 'paused';
}
```

#### WorkflowStep
```php
class WorkflowStep extends Model {
    protected $fillable = [
        'execution_id',
        'node_id',
        'step_name',
        'input_data',
        'output_data',
        'raw_response',
        'processed_output',
        'status',
        'started_at',
        'completed_at',
        'duration_ms',
        'retry_count',
        'max_retries',
        'error_message',
        'error_code',
        'debug_info'
    ];
    
    protected $casts = [
        'input_data' => 'json',
        'output_data' => 'json',
        'raw_response' => 'json',
        'processed_output' => 'json',
        'debug_info' => 'json',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
    
    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_RUNNING = 'running';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_SKIPPED = 'skipped';
    
    // Common error codes
    const ERROR_API_TIMEOUT = 'api_timeout';
    const ERROR_API_RATE_LIMIT = 'api_rate_limit';
    const ERROR_INVALID_CREDENTIALS = 'invalid_credentials';
    const ERROR_INVALID_CONFIG = 'invalid_config';
    const ERROR_EXTERNAL_SERVICE = 'external_service_error';
    const ERROR_VALIDATION = 'validation_error';
    
    // Relationships
    public function execution() { return $this->belongsTo(WorkflowExecution::class, 'execution_id'); }
    public function node() { return $this->belongsTo(Node::class, 'node_id'); }
    
    // Helper methods
    public function shouldRetry(): bool {
        return $this->status === self::STATUS_FAILED && 
               $this->retry_count < $this->max_retries;
    }
    
    public function recordStart(): void {
        $this->update([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
        ]);
    }
    
    public function recordSuccess(array $output, array $rawResponse = null): void {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'duration_ms' => $this->started_at ? now()->diffInMilliseconds($this->started_at) : null,
            'output_data' => $output,
            'raw_response' => $rawResponse,
            'processed_output' => $this->processOutput($output),
        ]);
    }
    
    public function recordFailure(string $errorMessage, string $errorCode = null, array $debugInfo = null): void {
        $this->update([
            'status' => self::STATUS_FAILED,
            'completed_at' => now(),
            'duration_ms' => $this->started_at ? now()->diffInMilliseconds($this->started_at) : null,
            'error_message' => $errorMessage,
            'error_code' => $errorCode,
            'debug_info' => $debugInfo,
            'retry_count' => $this->retry_count + 1,
        ]);
    }
    
    public function recordSkip(string $reason): void {
        $this->update([
            'status' => self::STATUS_SKIPPED,
            'completed_at' => now(),
            'error_message' => $reason,
        ]);
    }
    
    private function processOutput(array $output): array {
        // Process output for template variables
        $processed = [];
        
        foreach ($output as $key => $value) {
            // Flatten nested arrays for easier templating
            if (is_array($value)) {
                $processed[$key] = $value;
                // Also create flattened keys for arrays
                if (array_is_list($value)) {
                    foreach ($value as $index => $item) {
                        if (is_array($item)) {
                            foreach ($item as $subKey => $subValue) {
                                $processed["{$key}[{$index}].{$subKey}"] = $subValue;
                            }
                        } else {
                            $processed["{$key}[{$index}]"] = $item;
                        }
                    }
                }
            } else {
                $processed[$key] = $value;
            }
        }
        
        return $processed;
    }
    
    // Get formatted output for templates
    public function getTemplateVariables(): array {
        $stepId = $this->node_id;
        $variables = [];
        
        // Zapier-style variables: {{149133970__field_name}}
        if ($this->processed_output) {
            foreach ($this->processed_output as $key => $value) {
                $variables["{$stepId}__{$key}"] = $value;
            }
        }
        
        // Friendly variables: {{step_149133970.field_name}}
        if ($this->output_data) {
            foreach ($this->output_data as $key => $value) {
                $variables["step_{$stepId}.{$key}"] = $value;
            }
        }
        
        return $variables;
    }
}
```

#### TriggerEvent
```php
class TriggerEvent extends Model {
    protected $fillable = [
        'trigger_id',
        'integration_id',
        'event_source',
        'event_data',
        'metadata',
        'processed_at',
        'workflow_execution_id',
        'status',
        'error_message'
    ];
    
    protected $casts = [
        'event_data' => 'json',
        'metadata' => 'json',
        'processed_at' => 'datetime',
    ];
    
    // Event source constants
    const SOURCE_WEBHOOK = 'webhook';
    const SOURCE_API = 'api';
    const SOURCE_SCHEDULE = 'schedule';
    const SOURCE_MANUAL = 'manual';
    const SOURCE_DATABASE = 'database';
    const SOURCE_FILE = 'file';
    const SOURCE_EMAIL = 'email';
    
    // Status constants
    const STATUS_RECEIVED = 'received';
    const STATUS_PROCESSED = 'processed';
    const STATUS_FAILED = 'failed';
    const STATUS_IGNORED = 'ignored';
    
    // Relationships
    public function trigger() { return $this->belongsTo(Trigger::class); }
    public function integration() { return $this->belongsTo(Integration::class); }
    public function workflowExecution() { return $this->belongsTo(WorkflowExecution::class); }
    
    // Helper methods
    public function shouldProcess(): bool {
        return $this->status === self::STATUS_RECEIVED;
    }
    
    public function markAsProcessed(WorkflowExecution $execution = null): void {
        $this->update([
            'status' => self::STATUS_PROCESSED,
            'processed_at' => now(),
            'workflow_execution_id' => $execution?->id,
        ]);
    }
    
    public function markAsFailed(string $errorMessage): void {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'processed_at' => now(),
        ]);
    }
    
    public function markAsIgnored(string $reason = null): void {
        $this->update([
            'status' => self::STATUS_IGNORED,
            'error_message' => $reason,
            'processed_at' => now(),
        ]);
    }
}
```

## Workflow Patterns

### 1. Basic Linear Workflow
```
Trigger → Action → Action → Complete
```

### 2. Conditional Workflow
```
Trigger → Condition → Action A (if true)
                   → Action B (if false)
```

### 3. Loop Workflow
```
Trigger → Loop Start → Action → Loop End (repeat N times)
```

### 4. Parallel Workflow
```
Trigger → Parallel Start → Action A
                        → Action B
                        → Action C
       → Merge → Final Action
```

### 5. Delay Workflow
```
Trigger → Delay (wait X time) → Action
```

### 6. Loop Workflow with Dynamic Actions
```
Trigger → Loop Start → [Action Group Template] → Loop End
                    ↓
                Dynamic execution for each item:
                Item 1: Action A → Action B → Action C
                Item 2: Action A → Action B → Action C  
                Item 3: Action A → Action B → Action C
                ...
```

**Note**: Loops generate activities dynamically at runtime. The number of iterations isn't known until execution time (e.g., Shopify order line items). The loop contains a "group" or "template" of actions that gets executed for each item in the loop.

## Loop Execution with Dynamic Actions

### The Challenge

When designing loops in automation workflows, we face a fundamental challenge: **we don't know how many iterations will run until execution time**. For example:

- **Shopify Order Line Items**: An order might have 1 item or 20 items
- **Customer List**: A segment might contain 100 or 10,000 customers  
- **Email Recipients**: A campaign might target 50 or 5,000 recipients
- **API Pagination**: A response might have 3 pages or 300 pages

This creates a **dynamic workflow execution scenario** where the loop node must contain a "group" or "template" of actions that gets replicated and executed for each iteration.

### Loop Node Structure

```php
// Enhanced Node model with loop action groups
class Node extends Model {
    const TYPE_LOOP = 'loop';
    
    protected $casts = [
        'configuration' => 'json',
        'loop_actions' => 'json',  // Template of actions to execute per iteration
    ];
    
    // For loop nodes, this contains the action template
    public function getLoopActionTemplate(): array {
        return $this->loop_actions ?? [];
    }
}
```

### Loop Configuration Example

```php
// Loop node configuration for "Process Each Order Line Item"
{
    "type": "loop",
    "configuration": {
        "loop_over": "{{trigger.line_items}}",  // Array to iterate over
        "loop_variable": "item",                // Variable name for current item
        "max_iterations": 100,                  // Safety limit
        "parallel": false                       // Execute sequentially
    },
    "loop_actions": [
        {
            "action_type": "app_action",
            "integration_id": 2,
            "app_action_id": 15,
            "configuration": {
                "product_id": "{{item.product_id}}",
                "quantity": "{{item.quantity}}",
                "action": "update_inventory"
            }
        },
        {
            "action_type": "app_action", 
            "integration_id": 3,
            "app_action_id": 22,
            "configuration": {
                "message": "Processing {{item.product_name}} ({{item.quantity}} units)",
                "channel": "#inventory"
            }
        }
    ]
}
```

### Loop Executor Implementation

```php
<?php

namespace App\Workflows\Automation\Executors;

use App\Contracts\ActionInterface;
use App\Models\WorkflowStep;
use App\Services\TemplateResolver;
use Workflow\ActivityStub;

class LoopExecutor implements ActionInterface {
    public function __construct(
        private array $configuration,
        private array $loopActions = []
    ) {}
    
    public function execute(array $input, WorkflowStep $step): array {
        $step->recordStart();
        
        try {
            // Resolve the array to loop over
            $loopData = $this->resolveLoopData($input);
            $loopVariable = $this->configuration['loop_variable'] ?? 'item';
            $maxIterations = $this->configuration['max_iterations'] ?? 1000;
            $parallel = $this->configuration['parallel'] ?? false;
            
            if (empty($loopData)) {
                $step->recordSuccess([
                    'iterations' => 0,
                    'results' => [],
                    'skipped' => true,
                    'reason' => 'No items to loop over'
                ]);
                return ['iterations' => 0, 'results' => []];
            }
            
            // Safety check
            if (count($loopData) > $maxIterations) {
                throw new Exception("Loop exceeded maximum iterations: " . count($loopData) . " > {$maxIterations}");
            }
            
            // Execute loop actions for each item
            if ($parallel) {
                $results = $this->executeParallel($loopData, $loopVariable, $input, $step);
            } else {
                $results = $this->executeSequential($loopData, $loopVariable, $input, $step);
            }
            
            $output = [
                'iterations' => count($loopData),
                'results' => $results,
                'completed_at' => now()->toISOString()
            ];
            
            $step->recordSuccess($output);
            return $output;
            
        } catch (Exception $e) {
            $step->recordFailure(
                errorMessage: "Loop execution failed: " . $e->getMessage(),
                errorCode: WorkflowStep::ERROR_EXTERNAL_SERVICE,
                debugInfo: [
                    'loop_configuration' => $this->configuration,
                    'input_data' => $input,
                ]
            );
            throw $e;
        }
    }
    
    private function resolveLoopData(array $input): array {
        $loopOver = $this->configuration['loop_over'];
        
        // Resolve template variable (e.g., "{{trigger.line_items}}")
        $resolved = TemplateResolver::resolve($loopOver, $input);
        
        // Handle different data formats
        if (is_string($resolved)) {
            $decoded = json_decode($resolved, true);
            return is_array($decoded) ? $decoded : [$resolved];
        }
        
        return is_array($resolved) ? $resolved : [$resolved];
    }
    
    private function executeSequential(array $loopData, string $loopVariable, array $input, WorkflowStep $step): array {
        $results = [];
        
        foreach ($loopData as $index => $item) {
            // Create context for this iteration
            $iterationContext = array_merge($input, [
                $loopVariable => $item,
                'loop_index' => $index,
                'loop_count' => count($loopData),
                'loop_is_first' => $index === 0,
                'loop_is_last' => $index === count($loopData) - 1,
            ]);
            
            // Execute each action in the loop template
            $iterationResults = [];
            foreach ($this->loopActions as $actionIndex => $actionConfig) {
                $actionResult = $this->executeLoopAction($actionConfig, $iterationContext, $step, $index, $actionIndex);
                $iterationResults[] = $actionResult;
                
                // Make previous action results available to next action
                $iterationContext["loop_action_{$actionIndex}"] = $actionResult;
            }
            
            $results[] = [
                'iteration' => $index,
                'item' => $item,
                'actions' => $iterationResults,
                'completed_at' => now()->toISOString()
            ];
        }
        
        return $results;
    }
    
    private function executeParallel(array $loopData, string $loopVariable, array $input, WorkflowStep $step): array {
        // Create ActivityStub for each iteration
        $activities = [];
        
        foreach ($loopData as $index => $item) {
            $iterationContext = array_merge($input, [
                $loopVariable => $item,
                'loop_index' => $index,
                'loop_count' => count($loopData),
            ]);
            
            $activities[] = ActivityStub::make(
                LoopIterationActivity::class,
                [
                    'actions' => $this->loopActions,
                    'context' => $iterationContext,
                    'iteration' => $index,
                    'step' => $step
                ]
            );
        }
        
        // Execute all iterations in parallel
        $results = yield ActivityStub::all($activities);
        
        return $results;
    }
    
    private function executeLoopAction(array $actionConfig, array $context, WorkflowStep $step, int $iteration, int $actionIndex): array {
        // Resolve action configuration with current context
        $resolvedConfig = $this->resolveActionConfig($actionConfig, $context);
        
        // Create action executor based on type
        $executor = match($actionConfig['action_type']) {
            'app_action' => new AppActionExecutor(
                Integration::find($resolvedConfig['integration_id']),
                AppAction::find($resolvedConfig['app_action_id']),
                $resolvedConfig['configuration']
            ),
            'condition' => new ConditionExecutor($resolvedConfig['configuration']),
            'delay' => new DelayExecutor($resolvedConfig['configuration']),
            default => throw new Exception("Unknown loop action type: {$actionConfig['action_type']}")
        };
        
        // Create a sub-step for tracking
        $subStep = WorkflowStep::create([
            'execution_id' => $step->execution_id,
            'node_id' => $step->node_id,
            'step_name' => "Loop {$iteration}.{$actionIndex}: {$actionConfig['action_type']}",
            'input_data' => $context,
            'status' => WorkflowStep::STATUS_PENDING,
        ]);
        
        // Execute the action
        return $executor->execute($context, $subStep);
    }
    
    private function resolveActionConfig(array $actionConfig, array $context): array {
        // Deep resolve all template variables in the action config
        $resolved = [];
        
        foreach ($actionConfig as $key => $value) {
            if (is_array($value)) {
                $resolved[$key] = $this->resolveActionConfig($value, $context);
            } elseif (is_string($value)) {
                $resolved[$key] = TemplateResolver::resolve($value, $context);
            } else {
                $resolved[$key] = $value;
            }
        }
        
        return $resolved;
    }
    
    public function executeTest(array $input): array {
        // For testing, limit to 3 iterations max
        $loopData = $this->resolveLoopData($input);
        $testData = array_slice($loopData, 0, 3);
        
        return [
            'iterations' => count($testData),
            'results' => array_map(function($item, $index) {
                return [
                    'iteration' => $index,
                    'item' => $item,
                    'actions' => [
                        ['mock_result' => 'Loop action executed for item ' . $index]
                    ],
                    'completed_at' => now()->toISOString()
                ];
            }, $testData, array_keys($testData)),
            'test_mode' => true,
            'limited_to' => 3
        ];
    }
}
```

### Loop Iteration Activity (for Parallel Execution)

```php
<?php

namespace App\Workflows\Automation\Activities;

use Workflow\Activity;

class LoopIterationActivity extends Activity {
    public function execute(array $params): array {
        $actions = $params['actions'];
        $context = $params['context'];
        $iteration = $params['iteration'];
        $step = $params['step'];
        
        $results = [];
        
        foreach ($actions as $actionIndex => $actionConfig) {
            // Execute each action in sequence for this iteration
            $actionResult = $this->executeLoopAction($actionConfig, $context, $step, $iteration, $actionIndex);
            $results[] = $actionResult;
            
            // Make previous action results available
            $context["loop_action_{$actionIndex}"] = $actionResult;
        }
        
        return [
            'iteration' => $iteration,
            'item' => $context['item'],
            'actions' => $results,
            'completed_at' => now()->toISOString()
        ];
    }
    
    private function executeLoopAction(array $actionConfig, array $context, $step, int $iteration, int $actionIndex): array {
        // Same implementation as in LoopExecutor
        // ... (implementation details)
    }
}
```

### Example Use Cases

#### 1. Process Shopify Order Line Items
```php
// Configuration
{
    "loop_over": "{{trigger.line_items}}",
    "loop_variable": "line_item",
    "loop_actions": [
        {
            "action_type": "app_action",
            "integration_id": 5,  // Inventory system
            "app_action_id": 12,  // Update stock
            "configuration": {
                "product_id": "{{line_item.product_id}}",
                "quantity_sold": "{{line_item.quantity}}",
                "order_id": "{{trigger.order_id}}"
            }
        },
        {
            "action_type": "app_action",
            "integration_id": 6,  // Analytics
            "app_action_id": 18,  // Track sale
            "configuration": {
                "event": "product_sold",
                "product_id": "{{line_item.product_id}}",
                "revenue": "{{line_item.price * line_item.quantity}}",
                "customer_id": "{{trigger.customer_id}}"
            }
        }
    ]
}

// Runtime execution with 3 line items:
// Iteration 0: Update stock for Product A → Track sale for Product A
// Iteration 1: Update stock for Product B → Track sale for Product B  
// Iteration 2: Update stock for Product C → Track sale for Product C
```

#### 2. Send Personalized Emails to Customer Segments
```php
// Configuration
{
    "loop_over": "{{trigger.customer_list}}",
    "loop_variable": "customer",
    "parallel": true,  // Send emails in parallel
    "loop_actions": [
        {
            "action_type": "app_action",
            "integration_id": 3,  // Email service
            "app_action_id": 8,   // Send email
            "configuration": {
                "to": "{{customer.email}}",
                "subject": "Hi {{customer.first_name}}, special offer just for you!",
                "template": "personalized_offer",
                "merge_data": {
                    "customer_name": "{{customer.first_name}}",
                    "customer_tier": "{{customer.tier}}",
                    "recommended_products": "{{customer.recommended_products}}"
                }
            }
        }
    ]
}
```

### Database Schema Updates for Loop Actions

```sql
-- Add loop action template storage to automation_nodes
ALTER TABLE automation_nodes ADD COLUMN (
    loop_actions JSON NULL,           -- Template of actions to execute per iteration
    loop_configuration JSON NULL,    -- Loop-specific configuration
    
    INDEX idx_loop_type (type)
);

-- Add loop iteration tracking to workflow_steps
ALTER TABLE workflow_steps ADD COLUMN (
    parent_step_id BIGINT NULL,      -- Reference to parent loop step
    loop_iteration INT NULL,          -- Which iteration this step represents
    loop_action_index INT NULL,       -- Which action within the iteration
    
    INDEX idx_parent_step (parent_step_id),
    INDEX idx_loop_iteration (loop_iteration),
    FOREIGN KEY (parent_step_id) REFERENCES workflow_steps(id)
);
```

### Variable Scoping in Loops

Within loop iterations, the following variables are available:

```php
// Base context (from workflow)
$context = [
    'trigger' => [...],           // Original trigger data
    'step_123' => [...],          // Previous step outputs
    
    // Loop-specific variables
    'item' => $currentItem,       // Current loop item (configurable name)
    'loop_index' => 0,            // Current iteration index (0-based)
    'loop_count' => 5,            // Total number of iterations
    'loop_is_first' => true,      // Is this the first iteration?
    'loop_is_last' => false,      // Is this the last iteration?
    
    // Results from previous actions in this iteration
    'loop_action_0' => [...],     // Result from first action in loop
    'loop_action_1' => [...],     // Result from second action in loop
];

// Template usage examples:
"{{item.product_name}}"           // Current item property
"{{loop_index + 1}}"              // 1-based iteration number
"{{loop_action_0.inventory_id}}"  // Use result from previous action
```

This architecture ensures that loops can handle dynamic data while maintaining performance and reliability through proper activity management and variable scoping.

## Workflow Execution with Apps

### How Workflow Steps Execute

Each workflow step is now linked to an **App + Action/Trigger** combination:

1. **Trigger Event**: App webhook/polling detects event
2. **Workflow Start**: Laravel Workflow creates new execution
3. **Step Execution**: Each node executes its linked App Action
4. **Data Flow**: Output from one step becomes input for next
5. **Completion**: Workflow execution marked as complete

### Example Flow

```
Shopify "Order Created" Trigger
↓
App: Mailchimp, Action: "Add to List"
↓
App: Slack, Action: "Send Message"
↓
App: Internal, Action: "Update Database"
```

### Activity Types by App Category

### E-commerce Apps

#### Shopify App
**Triggers:**
- **Order Created**: New order placed
- **Order Updated**: Order status changed
- **Order Cancelled**: Order cancelled
- **Customer Created**: New customer registration
- **Customer Updated**: Customer profile changed
- **Product Created**: New product added
- **Product Updated**: Product details changed
- **Inventory Low**: Stock below threshold

**Actions:**
- **Create Customer**: Add new customer
- **Update Order**: Modify order details
- **Create Product**: Add new product
- **Update Inventory**: Adjust stock levels
- **Create Discount**: Generate coupon codes
- **Get Order**: Retrieve order details
- **Get Customer**: Retrieve customer details

#### WooCommerce App
**Triggers:**
- **Order Created**: New order placed
- **Order Status Changed**: Order status updated
- **Product Created**: New product added
- **Customer Registered**: New customer account

**Actions:**
- **Create Order**: Place new order
- **Update Order Status**: Change order status
- **Create Product**: Add new product
- **Update Product**: Modify product details
- **Send Email**: Send custom email

### Communication Apps

#### Mailchimp App
**Triggers:**
- **Subscriber Added**: New subscriber to list
- **Campaign Sent**: Email campaign sent
- **Unsubscribe**: Subscriber unsubscribed

**Actions:**
- **Add to List**: Add subscriber to list
- **Update Subscriber**: Modify subscriber details
- **Send Campaign**: Send email campaign
- **Create List**: Create new mailing list

#### Slack App
**Triggers:**
- **Message Posted**: New message in channel
- **User Joined**: New user joined workspace

**Actions:**
- **Send Message**: Send message to channel
- **Create Channel**: Create new channel
- **Add User**: Add user to channel

### Payment Apps

#### Stripe App
**Triggers:**
- **Payment Succeeded**: Payment completed
- **Payment Failed**: Payment failed
- **Subscription Created**: New subscription
- **Invoice Created**: New invoice generated

**Actions:**
- **Create Customer**: Add new customer
- **Create Payment**: Process payment
- **Create Subscription**: Set up subscription
- **Refund Payment**: Process refund

### Internal System Apps

#### Database App
**Actions:**
- **Create Record**: Add new database record
- **Update Record**: Modify existing record
- **Delete Record**: Remove record
- **Run Query**: Execute custom SQL

#### HTTP App
**Actions:**
- **Make Request**: Send HTTP request
- **Post Data**: Send POST request
- **Get Data**: Send GET request

### Utility Apps

#### Webhook App
**Triggers:**
- **Webhook Received**: Responds to HTTP POST requests
  - **Generates unique URL** for each trigger
  - **Accepts any JSON payload**
  - **Supports custom authentication** (API keys, signatures)
  - **Captures all request data** (headers, body, query params)

**Configuration:**
```php
class WebhookApp extends BaseApp {
    protected string $appKey = 'webhook';
    protected string $name = 'Webhook';
    protected string $description = 'Receive data from any HTTP POST request';
    protected string $category = 'utility';
    
    public function getTriggers(): array {
        return [
            'webhook' => [
                'name' => 'Webhook Received',
                'description' => 'Triggered when data is posted to the webhook URL',
                'generates_url' => true,  // Special flag for URL-generating triggers
                'output_schema' => [
                    'body' => ['type' => 'object', 'description' => 'Request body data'],
                    'headers' => ['type' => 'object', 'description' => 'Request headers'],
                    'query' => ['type' => 'object', 'description' => 'Query parameters'],
                    'method' => ['type' => 'string', 'description' => 'HTTP method'],
                    'user_agent' => ['type' => 'string', 'description' => 'User agent'],
                    'ip_address' => ['type' => 'string', 'description' => 'Source IP address'],
                    'timestamp' => ['type' => 'datetime', 'description' => 'Request timestamp'],
                ],
            ],
        ];
    }
}
```

#### Scheduler App
**Triggers:**
- **Schedule**: Run at specific time/date
- **Recurring**: Run on interval
- **Delay**: Run after X time
- **Cron**: Custom cron expression

#### Filter App
**Actions:**
- **Filter Data**: Apply data filters
- **Transform Data**: Convert data format
- **Validate Data**: Check data integrity

### Conditional Logic Apps

#### Condition App
**Actions:**
- **If/Then**: Basic conditional logic
- **Compare Values**: Compare two values
- **Check Range**: Value within range
- **Pattern Match**: Regex matching
- **Multiple Conditions**: AND/OR logic

#### Filter App
**Actions:**
- **Filter Array**: Filter array items
- **Remove Duplicates**: Remove duplicate values
- **Sort Data**: Sort array/objects
- **Group Data**: Group items by criteria

## App Development Framework with Saloon

### App Structure

Each App is a self-contained integration that defines its triggers, actions, and authentication methods. Apps are registered in the system and can be used across multiple workflows.

```php
abstract class BaseApp {
    protected string $appKey;
    protected string $lookupKey;
    protected string $name;
    protected string $description;
    protected string $iconUrl;
    protected string $logoUrl;
    protected string $category;
    protected string $version = '1.0.0';
    protected bool $isPublic = true;
    protected array $credentialsSchema = [];
    protected array $webhookConfig = [];
    protected array $rateLimits = [];
    protected array $settings = [];
    protected ?string $documentationUrl = null;
    protected ?string $developerName = null;
    protected ?string $developerUrl = null;
    
    abstract public function getSaloonConnector(): Connector;
    abstract public function getActions(): array;
    abstract public function getTriggers(): array;
    abstract public function getWebhooks(): array;
    
    // Getters for app registration
    public function getAppKey(): string { return $this->appKey; }
    public function getLookupKey(): string { return $this->lookupKey; }
    public function getName(): string { return $this->name; }
    public function getDescription(): string { return $this->description; }
    public function getIconUrl(): string { return $this->iconUrl; }
    public function getLogoUrl(): string { return $this->logoUrl; }
    public function getCategory(): string { return $this->category; }
    public function getVersion(): string { return $this->version; }
    public function isPublic(): bool { return $this->isPublic; }
    public function getCredentialsSchema(): array { return $this->credentialsSchema; }
    public function getWebhookConfig(): array { return $this->webhookConfig; }
    public function getRateLimits(): array { return $this->rateLimits; }
    public function getSettings(): array { return $this->settings; }
    public function getDocumentationUrl(): ?string { return $this->documentationUrl; }
    public function getDeveloperName(): ?string { return $this->developerName; }
    public function getDeveloperUrl(): ?string { return $this->developerUrl; }
    
    public function register(): void {
        // Register app in database with triggers and actions
        AppRegistry::register($this);
    }
    
    // Test the app's basic functionality
    public function testApp(Integration $integration): array {
        try {
            $connector = $this->getSaloonConnector();
            $connector->setIntegration($integration);
            
            // Test basic connectivity
            $testResult = $this->performHealthCheck($connector);
            
            return [
                'success' => true,
                'message' => 'App connection successful',
                'data' => $testResult
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => $e->getCode()
            ];
        }
    }
    
    // Override this method for app-specific health checks
    protected function performHealthCheck(Connector $connector): array {
        return ['status' => 'healthy'];
    }
}
```

### Saloon Integration Layer

Each App uses Saloon for HTTP communication with external services:

```php
abstract class AppConnector extends Connector {
    protected AppConnection $connection;
    
    public function __construct(AppConnection $connection) {
        $this->connection = $connection;
    }
    
    abstract public function resolveBaseUrl(): string;
    abstract public function defaultHeaders(): array;
    abstract public function defaultConfig(): array;
    
    public function getCredentials(string $key): mixed {
        return $this->connection->credentials[$key] ?? null;
    }
    
    protected function handleRateLimit(): void {
        // Implement rate limiting based on app configuration
    }
    
    protected function handleError(Exception $e): void {
        // Centralized error handling
    }
}
```

### Shopify App Example

```php
class ShopifyApp extends BaseApp {
    protected string $appKey = 'shopify';
    protected string $name = 'Shopify';
    protected string $description = 'E-commerce platform integration';
    protected string $iconUrl = '/icons/shopify.svg';
    protected string $category = 'ecommerce';
    
    protected array $credentialsSchema = [
        'shop_domain' => [
            'type' => 'string',
            'label' => 'Shop Domain',
            'description' => 'Your Shopify store domain (e.g., mystore.myshopify.com)',
            'required' => true,
        ],
        'access_token' => [
            'type' => 'string',
            'label' => 'Access Token',
            'description' => 'Shopify Admin API access token',
            'required' => true,
            'sensitive' => true,
        ],
    ];
    
    public function getSaloonConnector(): Connector {
        return new ShopifyConnector();
    }
    
    public function getActions(): array {
        return [
            'create_customer' => [
                'name' => 'Create Customer',
                'description' => 'Create a new customer in Shopify',
                'class' => CreateCustomerAction::class,
                'input_schema' => [
                    'email' => ['type' => 'string', 'required' => true],
                    'first_name' => ['type' => 'string', 'required' => false],
                    'last_name' => ['type' => 'string', 'required' => false],
                    'phone' => ['type' => 'string', 'required' => false],
                ],
                'output_schema' => [
                    'customer_id' => ['type' => 'integer'],
                    'email' => ['type' => 'string'],
                    'created_at' => ['type' => 'datetime'],
                ],
            ],
            'update_order' => [
                'name' => 'Update Order',
                'description' => 'Update an existing order',
                'class' => UpdateOrderAction::class,
                'input_schema' => [
                    'order_id' => ['type' => 'integer', 'required' => true],
                    'status' => ['type' => 'string', 'required' => false],
                    'tracking_number' => ['type' => 'string', 'required' => false],
                ],
            ],
            'create_product' => [
                'name' => 'Create Product',
                'description' => 'Create a new product in Shopify',
                'class' => CreateProductAction::class,
                'input_schema' => [
                    'title' => ['type' => 'string', 'required' => true],
                    'description' => ['type' => 'string', 'required' => false],
                    'price' => ['type' => 'number', 'required' => true],
                    'inventory_quantity' => ['type' => 'integer', 'required' => false],
                ],
            ],
        ];
    }
    
    public function getTriggers(): array {
        return [
            'order_created' => [
                'name' => 'Order Created',
                'description' => 'Triggered when a new order is created',
                'webhook_events' => ['orders/create'],
                'output_schema' => [
                    'order_id' => ['type' => 'integer'],
                    'customer_email' => ['type' => 'string'],
                    'total_amount' => ['type' => 'number'],
                    'created_at' => ['type' => 'datetime'],
                ],
            ],
            'customer_created' => [
                'name' => 'Customer Created',
                'description' => 'Triggered when a new customer is created',
                'webhook_events' => ['customers/create'],
                'output_schema' => [
                    'customer_id' => ['type' => 'integer'],
                    'email' => ['type' => 'string'],
                    'first_name' => ['type' => 'string'],
                    'last_name' => ['type' => 'string'],
                ],
            ],
            'product_updated' => [
                'name' => 'Product Updated',
                'description' => 'Triggered when a product is updated',
                'webhook_events' => ['products/update'],
                'output_schema' => [
                    'product_id' => ['type' => 'integer'],
                    'title' => ['type' => 'string'],
                    'updated_at' => ['type' => 'datetime'],
                ],
            ],
        ];
    }
    
    public function getWebhooks(): array {
        return [
            'orders/create' => 'order_created',
            'customers/create' => 'customer_created',
            'products/update' => 'product_updated',
            'inventory_levels/update' => 'inventory_updated',
        ];
    }
}
```

### Shopify Saloon Connector

```php
class ShopifyConnector extends AppConnector {
    public function resolveBaseUrl(): string {
        $shopDomain = $this->getCredentials('shop_domain');
        return "https://{$shopDomain}/admin/api/2023-10";
    }
    
    public function defaultHeaders(): array {
        return [
            'X-Shopify-Access-Token' => $this->getCredentials('access_token'),
            'Content-Type' => 'application/json',
        ];
    }
    
    public function defaultConfig(): array {
        return [
            'timeout' => 30,
        ];
    }
}
```

### Action Implementation

```php
class CreateCustomerAction extends Action {
    public function __construct(
        private AppConnection $connection,
        private array $config
    ) {}
    
    public function execute(array $input): array {
        $connector = new ShopifyConnector($this->connection);
        
        $request = new CreateCustomerRequest([
            'email' => $input['email'],
            'first_name' => $input['first_name'] ?? null,
            'last_name' => $input['last_name'] ?? null,
            'phone' => $input['phone'] ?? null,
        ]);
        
        $response = $connector->send($request);
        
        if ($response->failed()) {
            throw new ActionExecutionException(
                "Failed to create customer: " . $response->body()
            );
        }
        
        $customerData = $response->json('customer');
        
        return [
            'customer_id' => $customerData['id'],
            'email' => $customerData['email'],
            'created_at' => $customerData['created_at'],
        ];
    }
}
```

### Saloon Request Classes

```php
class CreateCustomerRequest extends Request {
    public function __construct(
        private array $customerData
    ) {}
    
    protected Method $method = Method::POST;
    
    public function resolveEndpoint(): string {
        return '/customers.json';
    }
    
    public function defaultBody(): array {
        return [
            'customer' => $this->customerData,
        ];
    }
}
```

### App Registry and Auto-Registration

```php
class AppRegistry {
    private static array $apps = [];
    
    public static function register(BaseApp $app): void {
        self::$apps[$app->getAppKey()] = $app;
        
        // Store app definition in database at deploy time
        self::persistApp($app);
    }
    
    public static function getApp(string $appKey): ?BaseApp {
        return self::$apps[$appKey] ?? null;
    }
    
    public static function executeAction(
        string $appKey,
        string $actionKey,
        AppAccount $account,
        array $input
    ): array {
        $app = self::getApp($appKey);
        $actions = $app->getActions();
        $actionConfig = $actions[$actionKey];
        
        $actionClass = $actionConfig['class'];
        $action = new $actionClass($account, $actionConfig);
        
        return $action->execute($input);
    }
    
    // Auto-register apps at deploy time
    public static function autoRegisterApps(): void {
        // Called during deployment to register all apps
        $appClasses = self::discoverAppClasses();
        
        foreach ($appClasses as $appClass) {
            $app = new $appClass();
            self::register($app);
        }
    }
    
    private static function discoverAppClasses(): array {
        // Scan app directory for app classes
        $appClasses = [];
        $appPath = app_path('Apps');
        
        if (File::exists($appPath)) {
            $files = File::allFiles($appPath);
            
            foreach ($files as $file) {
                if ($file->getExtension() === 'php') {
                    $className = self::getClassNameFromFile($file);
                    if ($className && is_subclass_of($className, BaseApp::class)) {
                        $appClasses[] = $className;
                    }
                }
            }
        }
        
        return $appClasses;
    }
    
    private static function persistApp(BaseApp $app): void {
        // Store app in database
        $appRecord = App::updateOrCreate(
            ['app_key' => $app->getAppKey()],
            [
                'name' => $app->getName(),
                'description' => $app->getDescription(),
                'icon_url' => $app->getIconUrl(),
                'category' => $app->getCategory(),
                'version' => $app->getVersion(),
                'is_public' => $app->isPublic(),
                'credentials_schema' => $app->getCredentialsSchema(),
                'webhook_config' => $app->getWebhookConfig(),
                'rate_limits' => $app->getRateLimits(),
                'settings' => $app->getSettings(),
            ]
        );
        
        // Store triggers
        foreach ($app->getTriggers() as $triggerKey => $triggerConfig) {
            AppTrigger::updateOrCreate(
                ['app_id' => $appRecord->id, 'trigger_key' => $triggerKey],
                [
                    'name' => $triggerConfig['name'],
                    'description' => $triggerConfig['description'],
                    'input_schema' => $triggerConfig['input_schema'] ?? null,
                    'output_schema' => $triggerConfig['output_schema'] ?? null,
                    'webhook_events' => $triggerConfig['webhook_events'] ?? null,
                    'polling_config' => $triggerConfig['polling_config'] ?? null,
                ]
            );
        }
        
        // Store actions
        foreach ($app->getActions() as $actionKey => $actionConfig) {
            AppAction::updateOrCreate(
                ['app_id' => $appRecord->id, 'action_key' => $actionKey],
                [
                    'name' => $actionConfig['name'],
                    'description' => $actionConfig['description'],
                    'input_schema' => $actionConfig['input_schema'] ?? null,
                    'output_schema' => $actionConfig['output_schema'] ?? null,
                    'http_config' => $actionConfig['http_config'] ?? null,
                    'retry_config' => $actionConfig['retry_config'] ?? null,
                    'timeout_seconds' => $actionConfig['timeout_seconds'] ?? 30,
                ]
            );
        }
    }
}
```

## Creating New Apps

### App Development Process

1. **Create App Class**: Extend `BaseApp` in `app/Apps/` directory
2. **Define Triggers & Actions**: Implement abstract methods
3. **Create Saloon Connector**: For HTTP communication
4. **Create Action Classes**: Individual action implementations
5. **Deploy**: Apps auto-register during deployment

### Complete Kajabi Integration Example

This example demonstrates a full Kajabi integration with "New Order" trigger and "Create Tag" action, showing how apps register themselves and handle step outputs.

#### Step 1: Kajabi App Definition

```php
<?php

namespace App\Apps;

use App\Apps\BaseApp;
use App\Apps\Kajabi\KajabiConnector;
use Saloon\Contracts\Connector;

class KajabiApp extends BaseApp {
    protected string $appKey = 'kajabi';
    protected string $lookupKey = 'kajabi-v2';
    protected string $name = 'Kajabi';
    protected string $description = 'Online course and membership platform integration';
    protected string $iconUrl = '/icons/kajabi.svg';
    protected string $logoUrl = '/logos/kajabi-logo.png';
    protected string $category = 'education';
    protected string $version = '2.0.0';
    protected bool $isPublic = true;
    protected ?string $documentationUrl = 'https://docs.kajabi.com/automation-integration';
    protected ?string $developerName = 'Kajabi Team';
    protected ?string $developerUrl = 'https://kajabi.com';
    
    protected array $credentialsSchema = [
        'api_key' => [
            'type' => 'string',
            'label' => 'API Key',
            'description' => 'Your Kajabi API key from Settings > Integrations',
            'required' => true,
            'sensitive' => true,
            'placeholder' => 'kaj_live_xxxxxxxxxx',
        ],
        'subdomain' => [
            'type' => 'string',
            'label' => 'Subdomain',
            'description' => 'Your Kajabi site subdomain (without .kajabi.com)',
            'required' => true,
            'placeholder' => 'mysite',
            'validation' => 'regex:/^[a-z0-9-]+$/',
        ],
    ];
    
    protected array $webhookConfig = [
        'supported' => true,
        'authentication' => [
            'type' => 'signature',
            'header' => 'X-Kajabi-Signature',
            'algorithm' => 'sha256',
        ],
        'events' => [
            'order.created',
            'order.completed',
            'member.created',
            'member.updated',
            'purchase.completed',
            'course.completed',
            'assessment.completed',
        ],
    ];
    
    protected array $rateLimits = [
        'requests_per_minute' => 100,
        'requests_per_hour' => 1000,
        'requests_per_day' => 10000,
    ];
    
    protected array $settings = [
        'timeout_seconds' => 30,
        'retry_attempts' => 3,
        'retry_delay_seconds' => 5,
    ];
    
    public function getSaloonConnector(): Connector {
        return new KajabiConnector();
    }
    
    public function getActions(): array {
        return [
            'create_tag' => [
                'name' => 'Create Tag',
                'description' => 'Create a new tag for organizing members',
                'class' => \App\Apps\Kajabi\Actions\CreateTagAction::class,
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
                'class' => \App\Apps\Kajabi\Actions\AddMemberTagAction::class,
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
                'class' => \App\Apps\Kajabi\Actions\CreateMemberAction::class,
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
    
    public function getTriggers(): array {
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
    
    public function getWebhooks(): array {
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
    
    protected function performHealthCheck(Connector $connector): array {
        try {
            // Test basic API connectivity
            $response = $connector->send(new \App\Apps\Kajabi\Requests\GetAccountInfoRequest());
            
            if ($response->successful()) {
                return [
                    'status' => 'healthy',
                    'account_name' => $response->json('account.name'),
                    'plan' => $response->json('account.plan'),
                    'member_count' => $response->json('account.member_count'),
                    'tested_at' => now()->toISOString(),
                ];
            }
            
            return [
                'status' => 'unhealthy',
                'error' => 'Invalid API response',
                'response_code' => $response->status(),
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
            ];
        }
    }
}
```

#### Step 2: Kajabi Connector with Saloon

```php
<?php

namespace App\Apps\Kajabi;

use App\Apps\AppConnector;
use Saloon\Http\Response;
use Saloon\Exceptions\Request\RequestException;

class KajabiConnector extends AppConnector {
    public function resolveBaseUrl(): string {
        $subdomain = $this->getCredentials('subdomain');
        return "https://{$subdomain}.kajabi.com/api";
    }
    
    public function defaultHeaders(): array {
        return [
            'Authorization' => 'Bearer ' . $this->getCredentials('api_key'),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'User-Agent' => 'Plandalf-Automation/1.0',
        ];
    }
    
    public function defaultConfig(): array {
        return [
            'timeout' => 30,
            'connect_timeout' => 10,
        ];
    }
    
    protected function handleRateLimit(): void {
        // Kajabi rate limiting implementation
        $retryAfter = 60; // seconds
        sleep($retryAfter);
    }
    
    protected function handleError(Exception $e): void {
        if ($e instanceof RequestException) {
            $response = $e->getResponse();
            
            // Log detailed error information
            logger()->error('Kajabi API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'headers' => $response->headers(),
                'request_url' => $e->getRequest()->getUrl(),
            ]);
            
            // Throw more specific exceptions
            match ($response->status()) {
                401 => throw new \App\Exceptions\InvalidCredentialsException('Invalid Kajabi API key'),
                403 => throw new \App\Exceptions\InsufficientPermissionsException('Insufficient API permissions'),
                429 => throw new \App\Exceptions\RateLimitExceededException('Rate limit exceeded'),
                default => throw new \App\Exceptions\ExternalServiceException('Kajabi API error: ' . $response->body()),
            };
        }
        
        throw $e;
    }
}
```

#### Step 3: Create Tag Action with Complete Output Handling

```php
<?php

namespace App\Apps\Kajabi\Actions;

use App\Apps\Kajabi\Requests\CreateTagRequest;
use App\Apps\Kajabi\KajabiConnector;
use App\Contracts\ActionInterface;
use App\Models\Integration;
use App\Models\WorkflowStep;
use Exception;

class CreateTagAction implements ActionInterface {
    public function __construct(
        private Integration $integration,
        private array $config
    ) {}
    
    public function execute(array $input, WorkflowStep $step): array {
        $step->recordStart();
        
        try {
            $connector = new KajabiConnector($this->integration);
            
            // Prepare the request
            $request = new CreateTagRequest([
                'name' => $input['name'],
                'color' => $input['color'] ?? '#3B82F6',
                'description' => $input['description'] ?? null,
            ]);
            
            // Execute the request
            $response = $connector->send($request);
            
            if ($response->failed()) {
                $step->recordFailure(
                    errorMessage: 'Failed to create tag: ' . $response->body(),
                    errorCode: WorkflowStep::ERROR_EXTERNAL_SERVICE,
                    debugInfo: [
                        'http_status' => $response->status(),
                        'response_body' => $response->body(),
                        'request_data' => $request->body(),
                    ]
                );
                
                throw new Exception("Failed to create tag in Kajabi");
            }
            
            // Parse the response
            $rawResponse = $response->json();
            $tagData = $rawResponse['tag'] ?? $rawResponse;
            
            // Process the output
            $processedOutput = [
                'tag_id' => $tagData['id'],
                'name' => $tagData['name'],
                'color' => $tagData['color'],
                'description' => $tagData['description'],
                'created_at' => $tagData['created_at'],
                'member_count' => $tagData['member_count'] ?? 0,
            ];
            
            // Record success with both raw and processed data
            $step->recordSuccess(
                output: $processedOutput,
                rawResponse: $rawResponse
            );
            
            return $processedOutput;
            
        } catch (Exception $e) {
            $step->recordFailure(
                errorMessage: $e->getMessage(),
                errorCode: $this->getErrorCode($e),
                debugInfo: [
                    'exception_class' => get_class($e),
                    'input_data' => $input,
                    'integration_id' => $this->integration->id,
                ]
            );
            
            throw $e;
        }
    }
    
    public function executeTest(array $input): array {
        // Return mock data for testing
        return [
            'tag_id' => 'tag_mock_' . uniqid(),
            'name' => $input['name'],
            'color' => $input['color'] ?? '#3B82F6',
            'description' => $input['description'] ?? null,
            'created_at' => now()->toISOString(),
            'member_count' => 0,
        ];
    }
    
    private function getErrorCode(Exception $e): string {
        return match (true) {
            $e instanceof \App\Exceptions\InvalidCredentialsException => WorkflowStep::ERROR_INVALID_CREDENTIALS,
            $e instanceof \App\Exceptions\RateLimitExceededException => WorkflowStep::ERROR_API_RATE_LIMIT,
            $e instanceof \App\Exceptions\ExternalServiceException => WorkflowStep::ERROR_EXTERNAL_SERVICE,
            default => WorkflowStep::ERROR_VALIDATION,
        };
    }
}
```

#### Step 4: Kajabi Request Classes

```php
<?php

namespace App\Apps\Kajabi\Requests;

use Saloon\Enums\Method;
use Saloon\Http\Request;

class CreateTagRequest extends Request {
    protected Method $method = Method::POST;
    
    public function __construct(private array $tagData) {}
    
    public function resolveEndpoint(): string {
        return '/tags';
    }
    
    public function defaultBody(): array {
        return [
            'tag' => $this->tagData,
        ];
    }
}

class GetAccountInfoRequest extends Request {
    protected Method $method = Method::GET;
    
    public function resolveEndpoint(): string {
        return '/account';
    }
}
```

#### Step 5: How Apps Register Themselves

```php
<?php

namespace App\Services;

use App\Models\App;
use App\Models\AppTrigger;
use App\Models\AppAction;
use App\Apps\BaseApp;
use Illuminate\Support\Facades\File;
use ReflectionClass;

class AppRegistry {
    private static array $apps = [];
    
    public static function register(BaseApp $app): void {
        self::$apps[$app->getAppKey()] = $app;
        
        // Persist app to database
        self::persistApp($app);
        
        logger()->info('App registered successfully', [
            'app_key' => $app->getAppKey(),
            'name' => $app->getName(),
            'version' => $app->getVersion(),
        ]);
    }
    
    public static function autoRegisterApps(): void {
        $appClasses = self::discoverAppClasses();
        
        foreach ($appClasses as $appClass) {
            try {
                $app = new $appClass();
                self::register($app);
            } catch (Exception $e) {
                logger()->error('Failed to register app', [
                    'app_class' => $appClass,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        logger()->info('Auto-registration completed', [
            'total_apps' => count(self::$apps),
        ]);
    }
    
    private static function discoverAppClasses(): array {
        $appClasses = [];
        $appPath = app_path('Apps');
        
        if (!File::exists($appPath)) {
            return $appClasses;
        }
        
        $files = File::allFiles($appPath);
        
        foreach ($files as $file) {
            if ($file->getExtension() === 'php' && !str_contains($file->getFilename(), 'Abstract')) {
                $className = self::getClassNameFromFile($file);
                
                if ($className && class_exists($className)) {
                    $reflection = new ReflectionClass($className);
                    
                    if (!$reflection->isAbstract() && $reflection->isSubclassOf(BaseApp::class)) {
                        $appClasses[] = $className;
                    }
                }
            }
        }
        
        return $appClasses;
    }
    
    private static function getClassNameFromFile($file): ?string {
        $contents = file_get_contents($file->getPathname());
        
        // Extract namespace
        if (preg_match('/namespace\s+([^;]+);/', $contents, $matches)) {
            $namespace = $matches[1];
        } else {
            $namespace = '';
        }
        
        // Extract class name
        if (preg_match('/class\s+(\w+)/', $contents, $matches)) {
            $className = $matches[1];
            return $namespace ? $namespace . '\\' . $className : $className;
        }
        
        return null;
    }
    
    private static function persistApp(BaseApp $app): void {
        // Create or update app record
        $appRecord = App::updateOrCreate(
            ['app_key' => $app->getAppKey()],
            [
                'lookup_key' => $app->getLookupKey(),
                'name' => $app->getName(),
                'description' => $app->getDescription(),
                'icon_url' => $app->getIconUrl(),
                'logo_url' => $app->getLogoUrl(),
                'category' => $app->getCategory(),
                'version' => $app->getVersion(),
                'is_public' => $app->isPublic(),
                'credentials_schema' => $app->getCredentialsSchema(),
                'webhook_config' => $app->getWebhookConfig(),
                'rate_limits' => $app->getRateLimits(),
                'settings' => $app->getSettings(),
                'documentation_url' => $app->getDocumentationUrl(),
                'developer_name' => $app->getDeveloperName(),
                'developer_url' => $app->getDeveloperUrl(),
            ]
        );
        
        // Sync triggers
        $triggers = $app->getTriggers();
        foreach ($triggers as $triggerKey => $triggerConfig) {
            AppTrigger::updateOrCreate(
                ['app_id' => $appRecord->id, 'trigger_key' => $triggerKey],
                [
                    'name' => $triggerConfig['name'],
                    'description' => $triggerConfig['description'],
                    'input_schema' => $triggerConfig['input_schema'] ?? null,
                    'output_schema' => $triggerConfig['output_schema'] ?? null,
                    'webhook_events' => $triggerConfig['webhook_events'] ?? null,
                    'polling_config' => $triggerConfig['polling_config'] ?? null,
                    'is_active' => true,
                ]
            );
        }
        
        // Sync actions
        $actions = $app->getActions();
        foreach ($actions as $actionKey => $actionConfig) {
            AppAction::updateOrCreate(
                ['app_id' => $appRecord->id, 'action_key' => $actionKey],
                [
                    'name' => $actionConfig['name'],
                    'description' => $actionConfig['description'],
                    'input_schema' => $actionConfig['input_schema'] ?? null,
                    'output_schema' => $actionConfig['output_schema'] ?? null,
                    'http_config' => $actionConfig['http_config'] ?? null,
                    'retry_config' => $actionConfig['retry_config'] ?? null,
                    'timeout_seconds' => $actionConfig['timeout_seconds'] ?? 30,
                    'is_active' => true,
                ]
            );
        }
    }
}
```

#### Step 6: Complete Workflow Example with Kajabi

**Scenario**: When a new order is created in Kajabi, automatically create a "New Customer" tag and add it to the member.

```php
// 1. Trigger: New Order (from Kajabi webhook)
$triggerData = [
    'order_id' => 'order_12345',
    'member_id' => 'member_67890',
    'member_email' => 'john@example.com',
    'member_name' => 'John Doe',
    'product_name' => 'Advanced Marketing Course',
    'amount' => 29700, // $297.00 in cents
    'currency' => 'USD',
    'created_at' => '2024-01-15T10:30:00Z',
];

// 2. Step 1: Create Tag Action
$step1Input = [
    'name' => 'New Customer - ' . date('Y-m'),
    'color' => '#10B981',
    'description' => 'New customers from ' . date('F Y'),
];

$step1Output = [
    'tag_id' => 'tag_abc123',
    'name' => 'New Customer - 2024-01',
    'color' => '#10B981',
    'description' => 'New customers from January 2024',
    'created_at' => '2024-01-15T10:30:05Z',
    'member_count' => 0,
];

// 3. Step 2: Add Tag to Member Action
$step2Input = [
    'member_email' => '{{trigger.member_email}}', // Resolves to 'john@example.com'
    'tag_name' => '{{step_1.name}}', // Resolves to 'New Customer - 2024-01'
];

$step2Output = [
    'member_id' => 'member_67890',
    'tag_id' => 'tag_abc123',
    'tagged_at' => '2024-01-15T10:30:10Z',
    'member_name' => 'John Doe',
    'total_tags' => 3,
];

// 4. Available template variables after each step:
$availableVariables = [
    // From trigger
    'trigger.order_id' => 'order_12345',
    'trigger.member_email' => 'john@example.com',
    'trigger.member_name' => 'John Doe',
    'trigger.product_name' => 'Advanced Marketing Course',
    'trigger.amount' => 29700,
    
    // From step 1 (Zapier-style)
    '149133970__tag_id' => 'tag_abc123',
    '149133970__name' => 'New Customer - 2024-01',
    '149133970__color' => '#10B981',
    
    // From step 1 (friendly)
    'step_149133970.tag_id' => 'tag_abc123',
    'step_149133970.name' => 'New Customer - 2024-01',
    'step_149133970.color' => '#10B981',
    
    // From step 2 (Zapier-style)
    '149133971__member_id' => 'member_67890',
    '149133971__tagged_at' => '2024-01-15T10:30:10Z',
    '149133971__total_tags' => 3,
    
    // From step 2 (friendly)
    'step_149133971.member_id' => 'member_67890',
    'step_149133971.tagged_at' => '2024-01-15T10:30:10Z',
    'step_149133971.total_tags' => 3,
];
```

This comprehensive example shows how the Kajabi integration handles:

1. **Complete app registration** with logos, lookup keys, and metadata
2. **Robust output handling** with raw responses, processed data, and error tracking
3. **Template variable generation** for both Zapier-style and friendly formats
4. **Proper error handling** with specific error codes and debugging information
5. **Test mode support** for workflow development and debugging
6. **Health checks** for integration validation
7. **Auto-discovery and registration** of apps during deployment

### Kajabi Connector

```php
<?php

namespace App\Apps\Kajabi;

use App\Apps\AppConnector;

class KajabiConnector extends AppConnector {
    public function resolveBaseUrl(): string {
        $subdomain = $this->getCredentials('subdomain');
        return "https://{$subdomain}/api";
    }
    
    public function defaultHeaders(): array {
        return [
            'Authorization' => 'Bearer ' . $this->getCredentials('api_key'),
            'Content-Type' => 'application/json',
        ];
    }
    
    public function defaultConfig(): array {
        return [
            'timeout' => 30,
        ];
    }
}
```

### Example Action Implementation

```php
<?php

namespace App\Apps\Kajabi\Actions;

use App\Apps\Kajabi\Requests\CreateMemberRequest;
use App\Apps\Kajabi\KajabiConnector;
use App\Contracts\ActionInterface;
use App\Models\AppAccount;

class CreateMemberAction implements ActionInterface {
    public function __construct(
        private AppAccount $account,
        private array $config
    ) {}
    
    public function execute(array $input): array {
        $connector = new KajabiConnector($this->account);
        
        $request = new CreateMemberRequest([
            'email' => $input['email'],
            'first_name' => $input['first_name'] ?? null,
            'last_name' => $input['last_name'] ?? null,
            'phone' => $input['phone'] ?? null,
            'tags' => $input['tags'] ?? [],
        ]);
        
        $response = $connector->send($request);
        
        if ($response->failed()) {
            throw new ActionExecutionException(
                "Failed to create member: " . $response->body()
            );
        }
        
        $memberData = $response->json();
        
        return [
            'member_id' => $memberData['id'],
            'email' => $memberData['email'],
            'status' => $memberData['status'],
            'created_at' => $memberData['created_at'],
        ];
    }
}
```

### Deployment Command

```php
<?php

namespace App\Console\Commands;

use App\Services\AppRegistry;
use Illuminate\Console\Command;

class RegisterAppsCommand extends Command {
    protected $signature = 'apps:register';
    protected $description = 'Register all apps and their actions/triggers';
    
    public function handle(): void {
        $this->info('Registering apps...');
        
        AppRegistry::autoRegisterApps();
        
        $this->info('Apps registered successfully!');
    }
}
```

### Auto-Registration in Deployment

```php
// In your deployment pipeline (e.g., deploy.sh)
php artisan apps:register

// Or in AppServiceProvider::boot()
public function boot(): void {
    if (app()->runningInConsole()) {
        $this->commands([
            RegisterAppsCommand::class,
        ]);
    }
    
    // Auto-register apps in production
    if (app()->environment('production')) {
        AppRegistry::autoRegisterApps();
    }
}
```

## Workflow Testing Framework

### Testing Strategy (Like Zapier)

Users need to test their workflows to see what data is available from previous steps. This generates the schema for templating variables like `{{149133970__line_items[]quantity}}`.

### Testing Models

```php
class WorkflowTest extends Model {
    protected $fillable = [
        'sequence_id',
        'test_data',          // Sample data from triggers/previous steps
        'step_outputs',       // Output from each tested step
        'status',             // 'running', 'completed', 'failed'
        'created_by',
        'completed_at'
    ];
    
    protected $casts = [
        'test_data' => 'json',
        'step_outputs' => 'json',
        'completed_at' => 'datetime',
    ];
    
    const STATUS_RUNNING = 'running';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
}

class WorkflowStepTest extends Model {
    protected $fillable = [
        'workflow_test_id',
        'node_id',
        'input_data',         // Data sent to this step
        'output_data',        // Data returned from this step  
        'execution_time_ms',
        'status',
        'error_message'
    ];
    
    protected $casts = [
        'input_data' => 'json',
        'output_data' => 'json',
    ];
}
```

### Testing Process

```php
class WorkflowTestService {
    public function testWorkflow(Sequence $sequence, ?array $sampleTriggerData = null): WorkflowTest {
        $test = WorkflowTest::create([
            'sequence_id' => $sequence->id,
            'status' => WorkflowTest::STATUS_RUNNING,
            'created_by' => auth()->id(),
        ]);
        
        // Use sample data or prompt user for test data
        $triggerData = $sampleTriggerData ?? $this->getSampleTriggerData($sequence);
        
        $test->update(['test_data' => $triggerData]);
        
        // Execute workflow in test mode
        $this->executeTestWorkflow($test, $triggerData);
        
        return $test;
    }
    
    private function executeTestWorkflow(WorkflowTest $test, array $triggerData): void {
        $sequence = $test->sequence;
        $currentData = $triggerData;
        $stepOutputs = [];
        
        foreach ($sequence->nodes as $node) {
            try {
                $stepTest = WorkflowStepTest::create([
                    'workflow_test_id' => $test->id,
                    'node_id' => $node->id,
                    'input_data' => $currentData,
                    'status' => 'running',
                ]);
                
                $startTime = microtime(true);
                
                // Execute the action in test mode
                $executor = $node->getExecutableAction();
                $output = $executor->executeTest($currentData); // Special test mode
                
                $executionTime = (microtime(true) - $startTime) * 1000;
                
                $stepTest->update([
                    'output_data' => $output,
                    'execution_time_ms' => $executionTime,
                    'status' => 'completed',
                ]);
                
                // Generate unique step ID for templating
                $stepId = $node->id;
                $stepOutputs[$stepId] = $output;
                
                // Make output available for next step
                $currentData = array_merge($currentData, [
                    "step_{$stepId}" => $output,
                    $stepId => $output, // For Zapier-style references
                ]);
                
            } catch (Exception $e) {
                $stepTest->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
                
                $test->update(['status' => WorkflowTest::STATUS_FAILED]);
                return;
            }
        }
        
        $test->update([
            'step_outputs' => $stepOutputs,
            'status' => WorkflowTest::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }
    
    public function generateTemplateVariables(WorkflowTest $test): array {
        $variables = [];
        
        // Add trigger variables
        foreach ($test->test_data as $key => $value) {
            $variables["trigger.{$key}"] = $this->formatVariable($value);
        }
        
        // Add step variables
        foreach ($test->step_outputs as $stepId => $output) {
            foreach ($output as $key => $value) {
                // Zapier-style: {{149133970__line_items[]quantity}}
                $variables["{$stepId}__{$key}"] = $this->formatVariable($value);
                
                // Friendly style: {{step_1.line_items[].quantity}}
                $variables["step_{$stepId}.{$key}"] = $this->formatVariable($value);
            }
        }
        
        return $variables;
    }
    
    private function formatVariable($value): string {
        if (is_array($value)) {
            return json_encode($value);
        }
        
        return (string) $value;
    }
}
```

### Testing API

```php
// Start workflow test
POST /api/workflows/{id}/test
{
    "trigger_data": {
        "order_id": 12345,
        "customer_email": "test@example.com",
        "total_amount": 150.00,
        "line_items": [
            {
                "product_id": 789,
                "quantity": 2,
                "price": 75.00
            }
        ]
    }
}

// Response
{
    "test": {
        "id": "test_abc123",
        "status": "completed",
        "step_outputs": {
            "149133970": {
                "subscriber_id": "sub_xyz789",
                "list_id": "list_premium",
                "added_at": "2024-01-15T10:30:00Z"
            },
            "149133971": {
                "message_id": "msg_abc456",
                "channel": "#sales",
                "sent_at": "2024-01-15T10:30:05Z"
            }
        },
        "available_variables": {
            "trigger.order_id": "12345",
            "trigger.customer_email": "test@example.com",
            "trigger.total_amount": "150.00",
            "trigger.line_items[0].quantity": "2",
            "149133970__subscriber_id": "sub_xyz789",
            "149133970__list_id": "list_premium",
            "149133971__message_id": "msg_abc456",
            "step_149133970.subscriber_id": "sub_xyz789",
            "step_149133971.message_id": "msg_abc456"
        }
    }
}

// Get test results with variable mapping
GET /api/workflows/{id}/tests/{test_id}
{
    "test": {
        "id": "test_abc123",
        "status": "completed",
        "execution_time_ms": 1250,
        "steps": [
            {
                "node_id": 149133970,
                "step_name": "Add to Mailchimp List",
                "input_data": {
                    "email": "test@example.com",
                    "list_id": "list_premium"
                },
                "output_data": {
                    "subscriber_id": "sub_xyz789",
                    "list_id": "list_premium",
                    "added_at": "2024-01-15T10:30:00Z"
                },
                "execution_time_ms": 850,
                "status": "completed"
            }
        ],
        "available_variables": {
            // All variables that can be used in subsequent steps
        }
    }
}
```

### Template Engine Integration

```php
class TemplateResolver {
    public static function resolve(string $template, array $context): string {
        // Support Zapier-style variables: {{149133970__line_items[]quantity}}
        // Support friendly variables: {{step_1.line_items[0].quantity}}
        // Support trigger variables: {{trigger.order_id}}
        
        return preg_replace_callback('/\{\{\s*(.*?)\s*\}\}/', function($matches) use ($context) {
            $variable = $matches[1];
            
            // Handle array notation: line_items[0].quantity
            if (preg_match('/^(.+?)\[(\d+)\]\.(.+)$/', $variable, $arrayMatches)) {
                $arrayKey = $arrayMatches[1];
                $index = (int) $arrayMatches[2];
                $property = $arrayMatches[3];
                
                if (isset($context[$arrayKey][$index][$property])) {
                    return $context[$arrayKey][$index][$property];
                }
            }
            
            // Handle dot notation: trigger.order_id
            if (str_contains($variable, '.')) {
                return data_get($context, $variable);
            }
            
            // Direct variable access
            return $context[$variable] ?? '';
        }, $template);
    }
}
```

## Database Schema Enhancements

### Required New Tables

```sql
-- App definitions (integration types)
CREATE TABLE apps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NULL,  -- NULL for public apps
    app_key VARCHAR(100) NOT NULL UNIQUE,       -- Unique identifier (e.g., 'kajabi', 'shopify')
    lookup_key VARCHAR(100) NOT NULL UNIQUE,    -- Alternative lookup key (e.g., 'kajabi-v1', 'shopify-2023')
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon_url VARCHAR(500) NULL,
    logo_url VARCHAR(500) NULL,                  -- High-res logo for branding
    category VARCHAR(100) NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    credentials_schema JSON NULL,
    webhook_config JSON NULL,
    rate_limits JSON NULL,
    settings JSON NULL,
    documentation_url VARCHAR(500) NULL,        -- Link to integration docs
    developer_name VARCHAR(255) NULL,           -- Who created this app
    developer_url VARCHAR(500) NULL,            -- Developer's website
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_app_key (app_key),
    INDEX idx_lookup_key (lookup_key),
    INDEX idx_category (category),
    INDEX idx_public (is_public),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- App triggers (available triggers per app)
CREATE TABLE app_triggers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    app_id BIGINT NOT NULL,
    trigger_key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    input_schema JSON NULL,
    output_schema JSON NULL,
    webhook_events JSON NULL,
    polling_config JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_app_trigger (app_id, trigger_key),
    UNIQUE KEY unique_app_trigger (app_id, trigger_key),
    FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

-- App actions (available actions per app)
CREATE TABLE app_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    app_id BIGINT NOT NULL,
    action_key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    input_schema JSON NULL,
    output_schema JSON NULL,
    http_config JSON NULL,
    retry_config JSON NULL,
    timeout_seconds INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_app_action (app_id, action_key),
    UNIQUE KEY unique_app_action (app_id, action_key),
    FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

-- Integrations (user's service connections - abstracted from just authentication)
CREATE TABLE integrations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL,
    app_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,           -- e.g., "Main Store", "Personal Shopify"
    type VARCHAR(50) NOT NULL DEFAULT 'api', -- 'api', 'webhook', 'oauth', 'custom'
    credentials JSON NULL,                -- encrypted credentials (API keys, OAuth tokens, etc.)
    webhook_url VARCHAR(500) NULL,        -- generated webhook URL for this integration
    webhook_secret VARCHAR(255) NULL,     -- secret for webhook verification
    connection_config JSON NULL,          -- connection-specific configuration
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP(6) NULL,
    sync_errors JSON NULL,
    settings JSON NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_org_app (organization_id, app_id),
    INDEX idx_webhook (webhook_url),
    INDEX idx_type (type),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (app_id) REFERENCES apps(id)
);

-- Enhanced workflow execution tracking
CREATE TABLE workflow_executions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sequence_id BIGINT NOT NULL,
    trigger_data JSON,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP(6) NULL,
    completed_at TIMESTAMP(6) NULL,
    duration_ms INT NULL,
    error_message TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_sequence_status (sequence_id, status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (sequence_id) REFERENCES automation_sequences(id)
);

-- Individual step execution tracking
CREATE TABLE workflow_steps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    execution_id BIGINT NOT NULL,
    node_id BIGINT NOT NULL,
    step_name VARCHAR(255) NULL,        -- Human-readable step name
    input_data JSON NULL,               -- Data sent to this step
    output_data JSON NULL,              -- Data returned from this step
    raw_response JSON NULL,             -- Raw API response (for debugging)
    processed_output JSON NULL,         -- Processed/transformed output
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
    started_at TIMESTAMP(6) NULL,
    completed_at TIMESTAMP(6) NULL,
    duration_ms INT NULL,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    error_message TEXT NULL,
    error_code VARCHAR(100) NULL,       -- Specific error code for categorization
    debug_info JSON NULL,               -- Additional debugging information
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_execution_node (execution_id, node_id),
    INDEX idx_status (status),
    INDEX idx_error_code (error_code),
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id),
    FOREIGN KEY (node_id) REFERENCES automation_nodes(id)
);

-- Pre-built workflow templates
CREATE TABLE workflow_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    template_data JSON NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_by BIGINT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_category (category),
    INDEX idx_public (is_public),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Data transformation mappings
CREATE TABLE data_mappings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    integration_id BIGINT NOT NULL,
    source_field VARCHAR(255) NOT NULL,
    target_field VARCHAR(255) NOT NULL,
    transformation_rules JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_integration (integration_id),
    FOREIGN KEY (integration_id) REFERENCES integrations(id)
);

-- Workflow testing
CREATE TABLE workflow_tests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sequence_id BIGINT NOT NULL,
    test_data JSON NULL,              -- Sample data from triggers/previous steps
    step_outputs JSON NULL,           -- Output from each tested step
    status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
    created_by BIGINT NULL,
    completed_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_sequence (sequence_id),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (sequence_id) REFERENCES automation_sequences(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Individual step testing
CREATE TABLE workflow_step_tests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workflow_test_id BIGINT NOT NULL,
    node_id BIGINT NOT NULL,
    input_data JSON NULL,             -- Data sent to this step
    output_data JSON NULL,            -- Data returned from this step
    execution_time_ms INT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    INDEX idx_workflow_test (workflow_test_id),
    INDEX idx_node (node_id),
    INDEX idx_status (status),
    FOREIGN KEY (workflow_test_id) REFERENCES workflow_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES automation_nodes(id)
);

-- Trigger event logs (stores all trigger initiation data regardless of source)
CREATE TABLE trigger_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trigger_id BIGINT NOT NULL,       -- Which trigger was initiated
    integration_id BIGINT NULL,       -- Integration that received the event (NULL for manual/internal triggers)
    event_source VARCHAR(50) NOT NULL, -- 'webhook', 'api', 'schedule', 'manual', 'database', 'file', 'email'
    event_data JSON NOT NULL,         -- Full event data (webhook body, API payload, schedule context, etc.)
    metadata JSON NULL,               -- Additional metadata (headers, source IP, user agent, etc.)
    processed_at TIMESTAMP(6) NULL,   -- When the event was processed
    workflow_execution_id BIGINT NULL, -- If triggered a workflow
    status VARCHAR(50) NOT NULL DEFAULT 'received', -- 'received', 'processed', 'failed', 'ignored'
    error_message TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    INDEX idx_trigger (trigger_id),
    INDEX idx_integration (integration_id),
    INDEX idx_event_source (event_source),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (trigger_id) REFERENCES automation_triggers(id),
    FOREIGN KEY (integration_id) REFERENCES integrations(id),
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id)
);
```

### Enhanced Existing Tables

```sql
-- Add fields to automation_sequences
ALTER TABLE automation_sequences ADD COLUMN (
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,
    metadata JSON NULL,
    settings JSON NULL,
    created_by BIGINT NULL,
    last_run_at TIMESTAMP(6) NULL,
    run_count INT DEFAULT 0,
    INDEX idx_active (is_active),
    INDEX idx_template (is_template),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add fields to automation_nodes for Integration architecture
ALTER TABLE automation_nodes ADD COLUMN (
    name VARCHAR(255) NULL,
    description TEXT NULL,
    integration_id BIGINT NULL,     -- links to user's integration
    app_action_id BIGINT NULL,      -- links to app action
    configuration JSON NULL,        -- replaces arguments with app-specific config
    position JSON NULL,             -- x, y coordinates for visual editor
    metadata JSON NULL,
    retry_config JSON NULL,
    timeout_seconds INT DEFAULT 30,
    INDEX idx_type (type),
    INDEX idx_integration (integration_id),
    INDEX idx_app_action (app_action_id),
    FOREIGN KEY (integration_id) REFERENCES integrations(id),
    FOREIGN KEY (app_action_id) REFERENCES app_actions(id)
);

-- Add fields to automation_triggers for Integration architecture
ALTER TABLE automation_triggers ADD COLUMN (
    name VARCHAR(255) NULL,         -- user-defined trigger name
    integration_id BIGINT NULL,     -- links to user's integration
    app_trigger_id BIGINT NULL,     -- links to app trigger
    configuration JSON NULL,        -- trigger-specific configuration
    conditions JSON NULL,           -- filter conditions (multiple triggers can have different filters)
    webhook_url VARCHAR(500) NULL,  -- generated webhook URL for webhook triggers
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP(6) NULL,
    trigger_count INT DEFAULT 0,
    INDEX idx_active (is_active),
    INDEX idx_sequence_trigger (sequence_id, app_trigger_id),  -- multiple triggers per sequence
    INDEX idx_integration (integration_id),
    INDEX idx_app_trigger (app_trigger_id),
    INDEX idx_webhook_url (webhook_url),
    FOREIGN KEY (integration_id) REFERENCES integrations(id),
    FOREIGN KEY (app_trigger_id) REFERENCES app_triggers(id)
);

-- Add fields to automation_edges
ALTER TABLE automation_edges ADD COLUMN (
    conditions JSON NULL,           -- conditional edge logic
    metadata JSON NULL,
    INDEX idx_from_node (from_node_id),
    INDEX idx_to_node (to_node_id)
);

-- Remove deprecated arguments column from automation_nodes
ALTER TABLE automation_nodes DROP COLUMN arguments;

-- Remove deprecated event_name and target columns from automation_triggers
ALTER TABLE automation_triggers DROP COLUMN event_name;
ALTER TABLE automation_triggers DROP COLUMN target_type;
ALTER TABLE automation_triggers DROP COLUMN target_id;
```

## Implementation Roadmap

### Phase 1: Foundation Enhancement (Months 1-2)
- [ ] Enhanced workflow models with new fields
- [ ] Advanced node types (condition, loop, delay)
- [ ] Improved workflow execution engine
- [ ] Basic integration framework setup
- [ ] Enhanced visual workflow builder

### Phase 2: Core Integrations (Months 3-4)
- [ ] Shopify integration with Saloon
- [ ] WooCommerce integration
- [ ] Email service integrations (SendGrid, Mailchimp)
- [ ] Payment gateway integrations (Stripe, PayPal)
- [ ] Webhook management system

### Phase 3: Advanced Features (Months 5-6)
- [ ] Parallel workflow execution
- [ ] Advanced conditional logic
- [ ] Loop and iteration support
- [ ] Data transformation engine
- [ ] Template library and marketplace

### Phase 4: Enterprise Features (Months 7-8)
- [ ] Advanced analytics and reporting
- [ ] Performance monitoring and alerting
- [ ] Role-based access control
- [ ] API rate limiting and quotas
- [ ] Custom code execution (sandboxed)

### Phase 5: Optimization (Months 9-10)
- [ ] Performance optimizations
- [ ] Advanced caching strategies
- [ ] Horizontal scaling support
- [ ] Advanced error handling and recovery
- [ ] Comprehensive testing suite

## API Documentation

### App Management API

```php
// Get all available apps
GET /api/apps
{
    "apps": [
        {
            "id": 1,
            "app_key": "shopify",
            "name": "Shopify",
            "description": "E-commerce platform integration",
            "category": "ecommerce",
            "icon_url": "/icons/shopify.svg",
            "is_public": true,
            "credentials_schema": {...}
        }
    ]
}

// Get app details with actions and triggers
GET /api/apps/{app_key}
{
    "app": {
        "id": 1,
        "app_key": "shopify",
        "name": "Shopify",
        "triggers": [
            {
                "id": 1,
                "trigger_key": "order_created",
                "name": "Order Created",
                "description": "Triggered when a new order is created",
                "output_schema": {...}
            }
        ],
        "actions": [
            {
                "id": 1,
                "action_key": "create_customer",
                "name": "Create Customer",
                "description": "Create a new customer",
                "input_schema": {...},
                "output_schema": {...}
            }
        ]
    }
}

// Create integration
POST /api/integrations
{
    "app_id": 1,
    "name": "Main Store",
    "type": "api",
    "credentials": {
        "shop_domain": "mystore.myshopify.com",
        "access_token": "..."
    }
}

// Create webhook integration (generates URL)
POST /api/integrations
{
    "app_id": 5,  // Webhook app
    "name": "External System Webhook",
    "type": "webhook"
}

// Response with generated webhook URL
{
    "integration": {
        "id": 15,
        "name": "External System Webhook",
        "type": "webhook",
        "webhook_url": "https://yourapp.com/api/webhooks/org/123/integration/15/token/abc123def456",
        "webhook_secret": "abc123def456",
        "is_active": true
    }
}

// Test integration
POST /api/integrations/{id}/test
{
    "success": true,
    "message": "Connection successful"
}

// Get integration details
GET /api/integrations/{id}
{
    "integration": {
        "id": 1,
        "app": {
            "name": "Shopify",
            "app_key": "shopify"
        },
        "name": "Main Store",
        "type": "api",
        "is_active": true,
        "last_sync_at": "2024-01-15T10:30:00Z",
        "webhook_url": null
    }
}

// Get all integrations for organization
GET /api/integrations
{
    "integrations": [
        {
            "id": 1,
            "app": {
                "name": "Shopify",
                "app_key": "shopify"
            },
            "name": "Main Store",
            "type": "api",
            "is_active": true
        },
        {
            "id": 2,
            "app": {
                "name": "Webhook",
                "app_key": "webhook"
            },
            "name": "External System Webhook",
            "type": "webhook",
            "webhook_url": "https://yourapp.com/api/webhooks/org/123/integration/2/token/xyz789",
            "is_active": true
        }
    ]
}
```

### Workflow Management API

```php
// Create workflow with integration-based nodes and multiple triggers
POST /api/workflows
{
    "name": "Customer Welcome Series",
    "description": "Send welcome emails to new customers",
    "triggers": [
        {
            "name": "Premium Orders",
            "integration_id": 1,  // Main Store Shopify integration
            "app_trigger_id": 1,  // Order Created trigger
            "configuration": {},
            "conditions": {
                "order_value": {
                    "operator": "gt",
                    "value": 100
                }
            }
        },
        {
            "name": "VIP Customer Orders",
            "integration_id": 1,  // Same Shopify integration
            "app_trigger_id": 1,  // Same Order Created trigger
            "configuration": {},
            "conditions": {
                "customer_tags": {
                    "operator": "contains",
                    "value": "vip"
                }
            }
        },
        {
            "name": "External System Webhook",
            "integration_id": 15, // Webhook integration
            "app_trigger_id": 25, // Webhook trigger
            "configuration": {
                "authentication": {
                    "type": "api_key",
                    "header": "X-API-Key",
                    "expected_value": "secret123"
                }
            },
            "webhook_url": "https://yourapp.com/api/webhooks/org/123/trigger/45/token/def456"
        }
    ],
    "nodes": [
        {
            "id": "action-1",
            "type": "action",
            "integration_id": 2,  // Mailchimp integration
            "app_action_id": 5,   // Add to List action
            "configuration": {
                "email": "{{trigger.customer_email}}",
                "list_id": "welcome-series"
            },
            "position": {"x": 300, "y": 100}
        },
        {
            "id": "action-2",
            "type": "action",
            "integration_id": 3,  // Slack integration
            "app_action_id": 8,   // Send Message action
            "configuration": {
                "channel": "#sales",
                "message": "New {{trigger.conditions.order_value > 100 ? 'premium' : 'VIP'}} order: {{trigger.order_id}}"
            },
            "position": {"x": 500, "y": 100}
        }
    ],
    "edges": [
        {
            "from_trigger": true,
            "to_node_id": "action-1"
        },
        {
            "from_node_id": "action-1",
            "to_node_id": "action-2"
        }
    ]
}

// Execute workflow
POST /api/workflows/{id}/execute
{
    "trigger_data": {
        "customer_id": 123,
        "order_id": 456,
        "customer_email": "john@example.com",
        "order_value": 150.00
    }
}

// Get workflow execution status
GET /api/workflows/{id}/executions/{execution_id}
{
    "execution": {
        "id": 1,
        "status": "completed",
        "started_at": "2024-01-15T10:30:00Z",
        "completed_at": "2024-01-15T10:31:30Z",
        "duration_ms": 90000,
        "steps": [
            {
                "node_id": "trigger-1",
                "status": "completed",
                "output_data": {
                    "customer_email": "john@example.com",
                    "order_value": 150.00
                }
            },
            {
                "node_id": "action-1",
                "status": "completed",
                "output_data": {
                    "subscriber_id": "abc123",
                    "added_to_list": true
                }
            }
        ]
    }
}

// Get workflow analytics
GET /api/workflows/{id}/analytics?period=30d
{
    "analytics": {
        "executions_count": 1250,
        "success_rate": 0.94,
        "average_duration_ms": 45000,
        "error_rate": 0.06,
        "most_common_errors": [
            "API timeout",
            "Invalid credentials"
        ]
    }
}
```

### Workflow Template API

```php
// Get workflow templates
GET /api/workflow-templates?category=ecommerce
{
    "templates": [
        {
            "id": 1,
            "name": "Customer Welcome Series",
            "description": "Automated welcome email series for new customers",
            "category": "ecommerce",
            "usage_count": 456,
            "template_data": {
                "nodes": [...],
                "edges": [...],
                "required_apps": ["shopify", "mailchimp"]
            }
        }
    ]
}

// Create workflow from template
POST /api/workflows/from-template
{
    "template_id": 1,
    "name": "My Customer Welcome Series",
    "integrations": {
        "shopify": 1,    // User selects which Shopify integration to use
        "mailchimp": 2,  // User selects which Mailchimp integration to use
        "slack": 3,      // User selects which Slack integration to use
        "webhook": 15    // User selects which webhook integration to use
    }
}
```

## Testing Strategy

### Unit Tests
- Model relationships and methods
- Activity execution logic
- Data transformation functions
- Integration API calls

### Integration Tests
- End-to-end workflow execution
- External API integration
- Database transactions
- Error handling scenarios

### Performance Tests
- Workflow execution speed
- Concurrent workflow handling
- Database query optimization
- API response times

## Security Considerations

### Data Protection
- Encrypt sensitive credentials
- Secure API token storage
- Data access audit logging
- GDPR compliance features

### Access Control
- Role-based permissions
- Organization-level isolation
- API rate limiting
- Webhook signature verification

### Monitoring
- Failed execution alerting
- Performance monitoring
- Error tracking and logging
- Usage analytics

## Success Metrics

### User Engagement
- Monthly active workflows: Target 10,000+
- Workflow completion rate: Target 95%+
- User retention rate: Target 80%+
- Average workflows per user: Target 5+

### Performance
- Workflow execution time: Target <30s average
- API response time: Target <500ms
- System uptime: Target 99.9%
- Error rate: Target <1%

### Business Impact
- Revenue generated through automations
- Cost savings from manual process elimination
- Customer satisfaction scores
- Integration adoption rates

## Key Architecture Decisions

### 1. Multiple Triggers per Sequence (Same Type, Different Filters)

**Problem**: A single workflow needs to respond to the same event type but with different conditions.

**Solution**: 
- Each `Sequence` can have multiple `Trigger` records
- All triggers must reference the same `app_trigger_id` (same event type)
- Each trigger can have different `conditions` for filtering

**Example**: 
```php
// Sequence: "Customer Welcome Series"
// Trigger 1: "Premium Orders" - Order Created with value > $100
// Trigger 2: "VIP Orders" - Order Created with customer.tags contains "vip"
// Both trigger the same workflow but with different offer filters
```

### 2. Integration Abstraction (Beyond Just Authentication)

**Problem**: Users need to connect to services in different ways - API keys, OAuth, webhooks, custom integrations.

**Solution**: 
- `Integration` model abstracts service connections beyond just authentication
- Supports multiple connection types: `api`, `webhook`, `oauth`, `custom`
- Users create multiple integrations per app (e.g., "Main Store", "Test Store", "External Webhook")
- When creating triggers/actions, users select which integration to use
- Workflow logic is separate from connection details

**Benefits**:
- Users can have multiple Shopify stores, Mailchimp accounts, webhook endpoints, etc.
- Supports various authentication methods (API keys, OAuth, webhooks)
- Allows third-party companies to create their own integrations
- Easy to switch between integrations without recreating workflows
- Clear separation of concerns

**Integration Types**:
- **API**: Standard API integration with credentials (API keys, tokens)
- **Webhook**: Webhook-based integration (generates unique URLs)
- **OAuth**: OAuth-based integration (handles OAuth flow)
- **Custom**: Custom integration type for specialized connections

### 3. Node Representation (Nodes = Actions)

**Problem**: How does a node know what it represents?

**Solution**: 
- **Nodes are always actions** - they execute something
- **Triggers are separate** - they initiate workflows
- Each node has a `type` field that determines its executor:
  - `action` → `AppActionExecutor` (calls external API)
  - `condition` → `ConditionExecutor` (evaluates logic)
  - `loop` → `LoopExecutor` (repeats actions)
  - `delay` → `DelayExecutor` (waits)
  - `parallel` → `ParallelExecutor` (runs multiple actions)
  - `merge` → `MergeExecutor` (combines results)

**Node Resolution**:
```php
public function getExecutableAction(): ActionInterface {
    return match($this->type) {
        'action' => new AppActionExecutor($this->appAccount, $this->appAction, $this->configuration),
        'condition' => new ConditionExecutor($this->configuration),
        'loop' => new LoopExecutor($this->configuration),
        // ... etc
    };
}
```

### 4. Auto-Registration of App Actions

**Problem**: App actions need to register themselves at deploy time.

**Solution**: 
- Apps auto-discover and register during deployment
- `php artisan apps:register` command scans `app/Apps/` directory
- Apps persist their triggers/actions to database
- No manual registration required

**Process**:
1. Create app class in `app/Apps/`
2. Deploy application
3. `AppRegistry::autoRegisterApps()` runs automatically
4. App definition stored in database
5. Actions/triggers available for use

### 5. Workflow Execution Flow

**How it works**:
1. **Event occurs** (e.g., Shopify order created)
2. **Webhook received** or **polling detects** event
3. **Triggers evaluated** - check conditions for each trigger
4. **Workflow starts** - Laravel Workflow creates execution
5. **Nodes execute** - each node calls its executor
6. **Data flows** - output becomes input for next node
7. **Completion** - workflow marked as complete

### 6. Webhook URL Generation

**Problem**: Users need to receive data from external systems that don't have native integrations.

**Solution**: 
- Webhook triggers automatically generate unique URLs
- Each trigger gets its own webhook endpoint
- Trigger UUID serves as both identifier and security token
- Support for custom authentication (API keys, signatures)
- Log all webhook requests for debugging

**Webhook URL Format**:
```
https://yourapp.com/api/webhooks/{trigger_uuid}
```

**Example Flow**:
1. User creates webhook trigger
2. System generates unique URL: `https://yourapp.com/api/webhooks/01234567-89ab-cdef-0123-456789abcdef`
3. User configures external system to POST to this URL
4. When external system sends data, workflow triggers
5. All webhook data becomes available in template variables

### 7. Testing Framework (Like Zapier)

**Problem**: Users need to see what data is available from previous steps to build template variables.

**Solution**: 
- Test mode execution that doesn't affect real systems
- Capture input/output data from each step
- Generate template variable mappings
- Support both Zapier-style (`{{149133970__field}}`) and friendly (`{{step_1.field}}`) variables

**Testing Process**:
1. User provides sample trigger data
2. System executes workflow in test mode
3. Each step's output is captured
4. Template variables are generated and displayed
5. User can see available variables for subsequent steps

**Variable Formats**:
- **Zapier-style**: `{{149133970__line_items[0].quantity}}`
- **Friendly**: `{{step_149133970.line_items[0].quantity}}`
- **Trigger**: `{{trigger.order_id}}`

### 8. User Experience

**Creating a workflow**:
1. User creates integrations (authenticate with services or generate webhook URLs)
2. User creates sequence with name/description
3. User adds triggers (selects integration + trigger type + conditions)
4. User adds actions (selects integration + action type + configuration)
5. User tests workflow with sample data
6. User connects nodes with edges based on test results
7. System auto-registers and executes

**Example User Flow**:
```
1. Connect Shopify integration ("Main Store")
2. Connect Mailchimp integration ("Marketing Lists")
3. Create webhook integration ("External CRM")
4. Create workflow "VIP Customer Welcome"
5. Add trigger: Shopify "Order Created" with condition: customer_tags contains "vip"
6. Add trigger: Webhook "CRM Customer Updated"
7. Add action: Mailchimp "Add to List" with list "VIP Customers"
8. Test workflow with sample data
9. Use variables like {{trigger.customer_email}} in actions
10. Activate workflow
```

## Benefits of This Architecture

1. **Modularity**: Each app is self-contained
2. **Scalability**: Easy to add new integrations
3. **Flexibility**: Multiple accounts per service
4. **Maintainability**: Clear separation of concerns
5. **Developer Experience**: Consistent patterns
6. **User Experience**: Intuitive workflow creation
7. **Performance**: Optimized for high-volume processing

## Conclusion

This comprehensive automation platform will position us as the leading "Zapier for Commerce" solution, leveraging our existing Laravel workflow foundation while adding powerful commerce-specific features and integrations. The phased approach ensures we can deliver value incrementally while building towards a complete enterprise-grade solution.

The combination of Laravel's robust framework, the laravel-workflow package's execution engine, Saloon's HTTP client capabilities, and our commerce-focused feature set creates a unique and powerful automation platform for modern e-commerce businesses. 
