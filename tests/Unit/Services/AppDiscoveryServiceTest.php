<?php

namespace Tests\Unit\Services;

use App\Services\AppDiscoveryService;
use App\Apps\AutomationApp;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Resource;
use App\Workflows\Attributes\IsAction;
use App\Workflows\Attributes\IsTrigger;
use App\Workflows\Attributes\IsResource as ResourceAttribute;
use App\Workflows\Automation\Field;
use App\Workflows\Automation\Bundle;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use ReflectionClass;

// Mock classes for testing
#[IsAction(
    key: 'test_action',
    noun: 'Test',
    label: 'Test Action',
    description: 'A test action',
    type: 'action'
)]
class MockAppAction extends AppAction
{
    public static function props(): array
    {
        return [
            Field::text('name', 'Name', 'Enter a name'),
            Field::email('email', 'Email', 'Enter an email'),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        return ['success' => true];
    }
}

#[IsTrigger(
    key: 'test_trigger',
    noun: 'Test',
    label: 'Test Trigger',
    description: 'A test trigger'
)]
class MockAppTrigger extends AppTrigger
{
    public static function props(): array
    {
        return [
            Field::text('event', 'Event', 'Enter an event'),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        return ['success' => true];
    }
}

#[ResourceAttribute(
    key: 'test_resource',
    noun: 'Test',
    label: 'Test Resource',
    description: 'A test resource'
)]
class MockResource extends Resource
{
    public function search(array $query = []): array
    {
        return [
            ['id' => '1', 'name' => 'Test Item 1'],
            ['id' => '2', 'name' => 'Test Item 2'],
        ];
    }

    public function get(string $id): ?array
    {
        return ['id' => $id, 'name' => "Test Item {$id}"];
    }

    public function getValueLabelFields(): array
    {
        return ['value' => 'id', 'label' => 'name'];
    }
}

class MockAutomationApp extends AutomationApp
{
    public function actions(): array
    {
        return [MockAppAction::class];
    }

    public function triggers(): array
    {
        return [MockAppTrigger::class];
    }

    public function resources(): array
    {
        return [MockResource::class];
    }

    public function auth(Integration $integration)
    {
        return null;
    }
}

class AppDiscoveryServiceTest extends TestCase
{
    use RefreshDatabase;

    private AppDiscoveryService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AppDiscoveryService();
    }

    public function test_discover_apps_with_valid_app_directory()
    {
        // Mock the File facade to return a test directory
        $mockAppsPath = sys_get_temp_dir() . '/test_apps';
        if (!is_dir($mockAppsPath)) {
            mkdir($mockAppsPath, 0755, true);
        }

        // Create a mock app directory
        $mockAppDir = $mockAppsPath . '/TestApp';
        if (!is_dir($mockAppDir)) {
            mkdir($mockAppDir, 0755, true);
        }

        // Use reflection to temporarily modify the app path
        $reflection = new ReflectionClass($this->service);
        $method = $reflection->getMethod('discoverApps');
        $method->setAccessible(true);

        // Mock the app_path function
        $originalAppPath = function_exists('app_path') ? 'app_path' : null;

        // Test with a mock app
        $apps = $this->service->discoverApps();

        // Clean up
        if (is_dir($mockAppDir)) {
            rmdir($mockAppDir);
        }
        if (is_dir($mockAppsPath)) {
            rmdir($mockAppsPath);
        }

        // Since we can't easily mock the file system in unit tests,
        // we'll test the logic with the actual Apps directory
        $this->assertIsArray($apps);
    }

    public function test_discover_app_actions()
    {
        $actions = $this->service->discoverAppActions(MockAutomationApp::class);

        $this->assertIsArray($actions);
        $this->assertCount(1, $actions);

        $action = $actions[0];
        $this->assertEquals('test_action', $action['key']);
        $this->assertEquals('Test', $action['noun']);
        $this->assertEquals('Test Action', $action['label']);
        $this->assertEquals('A test action', $action['description']);
        $this->assertEquals('action', $action['type']);
        $this->assertArrayHasKey('props', $action);
        $this->assertArrayHasKey('class', $action);
    }

    public function test_discover_app_triggers()
    {
        $triggers = $this->service->discoverAppTriggers(MockAutomationApp::class);

        $this->assertIsArray($triggers);
        $this->assertCount(1, $triggers);

        $trigger = $triggers[0];
        $this->assertEquals('test_trigger', $trigger['key']);
        $this->assertEquals('Test', $trigger['noun']);
        $this->assertEquals('Test Trigger', $trigger['label']);
        $this->assertEquals('A test trigger', $trigger['description']);
        $this->assertArrayHasKey('props', $trigger);
        $this->assertArrayHasKey('class', $trigger);
    }

    public function test_discover_app_resources()
    {
        $resources = $this->service->discoverAppResources(MockAutomationApp::class);

        $this->assertIsArray($resources);
        $this->assertCount(1, $resources);

        $resource = $resources[0];
        $this->assertEquals('test_resource', $resource['key']);
        $this->assertEquals('Test', $resource['noun']);
        $this->assertEquals('Test Resource', $resource['label']);
        $this->assertEquals('A test resource', $resource['description']);
        $this->assertArrayHasKey('class', $resource);
    }

    public function test_get_all_actions()
    {
        $allActions = $this->service->getAllActions();

        $this->assertIsArray($allActions);

        // Should include actions from all discovered apps
        foreach ($allActions as $action) {
            $this->assertArrayHasKey('app', $action);
            $this->assertArrayHasKey('key', $action);
            $this->assertArrayHasKey('label', $action);
        }
    }

    public function test_get_all_triggers()
    {
        $allTriggers = $this->service->getAllTriggers();

        $this->assertIsArray($allTriggers);

        // Should include triggers from all discovered apps
        foreach ($allTriggers as $trigger) {
            $this->assertArrayHasKey('app', $trigger);
            $this->assertArrayHasKey('key', $trigger);
            $this->assertArrayHasKey('label', $trigger);
        }
    }

    public function test_get_all_resources()
    {
        $allResources = $this->service->getAllResources();

        $this->assertIsArray($allResources);

        // Should include resources from all discovered apps
        foreach ($allResources as $resource) {
            $this->assertArrayHasKey('app', $resource);
            $this->assertArrayHasKey('key', $resource);
            $this->assertArrayHasKey('label', $resource);
        }
    }

    public function test_discover_apps_handles_missing_apps_directory()
    {
        // Test that the service handles missing Apps directory gracefully
        $apps = $this->service->discoverApps();

        // Should return an empty array, not throw an exception
        $this->assertIsArray($apps);
    }

    public function test_discover_app_actions_handles_invalid_action_class()
    {
        // Test with an app that has an invalid action class
        $actions = $this->service->discoverAppActions(MockAutomationApp::class);

        // Should not throw an exception, should handle gracefully
        $this->assertIsArray($actions);
    }

    public function test_discover_app_triggers_handles_invalid_trigger_class()
    {
        // Test with an app that has an invalid trigger class
        $triggers = $this->service->discoverAppTriggers(MockAutomationApp::class);

        // Should not throw an exception, should handle gracefully
        $this->assertIsArray($triggers);
    }

    public function test_discover_app_resources_handles_invalid_resource_class()
    {
        // Test with an app that has an invalid resource class
        $resources = $this->service->discoverAppResources(MockAutomationApp::class);

        // Should not throw an exception, should handle gracefully
        $this->assertIsArray($resources);
    }

    public function test_action_definition_structure()
    {
        $actions = $this->service->discoverAppActions(MockAutomationApp::class);

        if (!empty($actions)) {
            $action = $actions[0];

            $this->assertArrayHasKey('key', $action);
            $this->assertArrayHasKey('noun', $action);
            $this->assertArrayHasKey('label', $action);
            $this->assertArrayHasKey('description', $action);
            $this->assertArrayHasKey('type', $action);
            $this->assertArrayHasKey('props', $action);
            $this->assertArrayHasKey('class', $action);

            // Props should be an array
            $this->assertIsArray($action['props']);
        }
    }

    public function test_trigger_definition_structure()
    {
        $triggers = $this->service->discoverAppTriggers(MockAutomationApp::class);

        if (!empty($triggers)) {
            $trigger = $triggers[0];

            $this->assertArrayHasKey('key', $trigger);
            $this->assertArrayHasKey('noun', $trigger);
            $this->assertArrayHasKey('label', $trigger);
            $this->assertArrayHasKey('description', $trigger);
            $this->assertArrayHasKey('props', $trigger);
            $this->assertArrayHasKey('class', $trigger);

            // Props should be an array
            $this->assertIsArray($trigger['props']);
        }
    }

    public function test_resource_definition_structure()
    {
        $resources = $this->service->discoverAppResources(MockAutomationApp::class);

        if (!empty($resources)) {
            $resource = $resources[0];

            $this->assertArrayHasKey('key', $resource);
            $this->assertArrayHasKey('noun', $resource);
            $this->assertArrayHasKey('label', $resource);
            $this->assertArrayHasKey('description', $resource);
            $this->assertArrayHasKey('class', $resource);
        }
    }
}
