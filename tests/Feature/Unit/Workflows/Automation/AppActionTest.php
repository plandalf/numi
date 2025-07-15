<?php

namespace Tests\Feature\Unit\Workflows\Automation;

use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Field;
use App\Workflows\Automation\Bundle;
use App\Workflows\Attributes\Action;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Test action classes
#[Action(
    key: 'test_action',
    noun: 'Test',
    label: 'Test Action',
    description: 'A test action',
    type: 'action'
)]
class TestAppAction extends AppAction
{
    public static function props(): array
    {
        return [
            Field::text('name', 'Name', 'Enter a name'),
            Field::email('email', 'Email', 'Enter an email'),
            Field::select('status', 'Status', 'Select status', [
                ['value' => 'active', 'label' => 'Active'],
                ['value' => 'inactive', 'label' => 'Inactive'],
            ]),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        return ['success' => true, 'data' => $bundle->get('name')];
    }
}

#[Action(
    key: 'simple_action',
    noun: 'Simple',
    label: 'Simple Action',
    description: 'A simple action without props',
    type: 'action'
)]
class SimpleAppAction extends AppAction
{
    public function __invoke(Bundle $bundle): array
    {
        return ['success' => true];
    }
}

class AppActionTest extends TestCase
{
    public function test_get_metadata_from_action_attribute()
    {
        $metadata = TestAppAction::getMetadata();
        
        $this->assertEquals('test_action', $metadata['key']);
        $this->assertEquals('Test', $metadata['noun']);
        $this->assertEquals('Test Action', $metadata['label']);
        $this->assertEquals('A test action', $metadata['description']);
        $this->assertEquals('action', $metadata['type']);
    }

    public function test_get_metadata_throws_exception_without_action_attribute()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('AppAction must have an Action attribute');
        
        // Create a class without the Action attribute
        eval('
            namespace Tests\Feature\Unit\Workflows\Automation;
            use App\Workflows\Automation\AppAction;
            use App\Workflows\Automation\Bundle;
            
            class InvalidAppAction extends AppAction
            {
                public function __invoke(Bundle $bundle): array
                {
                    return ["success" => true];
                }
            }
        ');
        
        $invalidClass = 'Tests\Feature\Unit\Workflows\Automation\InvalidAppAction';
        $invalidClass::getMetadata();
    }

    public function test_get_props_with_defined_props_method()
    {
        $props = TestAppAction::getProps();
        
        $this->assertIsArray($props);
        $this->assertCount(3, $props);
        
        // Check name field
        $this->assertArrayHasKey('name', $props);
        $this->assertEquals('text', $props['name']['type']);
        $this->assertEquals('Name', $props['name']['label']);
        $this->assertEquals('Enter a name', $props['name']['description']);
        
        // Check email field
        $this->assertArrayHasKey('email', $props);
        $this->assertEquals('email', $props['email']['type']);
        $this->assertEquals('Email', $props['email']['label']);
        $this->assertEquals('Enter an email', $props['email']['description']);
        
        // Check status field
        $this->assertArrayHasKey('status', $props);
        $this->assertEquals('select', $props['status']['type']);
        $this->assertEquals('Status', $props['status']['label']);
        $this->assertEquals('Select status', $props['status']['description']);
        $this->assertArrayHasKey('options', $props['status']);
    }

    public function test_get_props_without_props_method()
    {
        $props = SimpleAppAction::getProps();
        
        $this->assertIsArray($props);
        $this->assertEmpty($props);
    }

    public function test_get_definition_combines_metadata_and_props()
    {
        $definition = TestAppAction::getDefinition();
        
        $this->assertIsArray($definition);
        $this->assertArrayHasKey('key', $definition);
        $this->assertArrayHasKey('noun', $definition);
        $this->assertArrayHasKey('label', $definition);
        $this->assertArrayHasKey('description', $definition);
        $this->assertArrayHasKey('type', $definition);
        $this->assertArrayHasKey('props', $definition);
        $this->assertArrayHasKey('class', $definition);
        
        $this->assertEquals('test_action', $definition['key']);
        $this->assertEquals('Test', $definition['noun']);
        $this->assertEquals('Test Action', $definition['label']);
        $this->assertEquals('A test action', $definition['description']);
        $this->assertEquals('action', $definition['type']);
        $this->assertEquals(TestAppAction::class, $definition['class']);
        
        // Props should be included
        $this->assertIsArray($definition['props']);
        $this->assertCount(3, $definition['props']);
    }

    public function test_get_definition_without_props()
    {
        $definition = SimpleAppAction::getDefinition();
        
        $this->assertIsArray($definition);
        $this->assertArrayHasKey('props', $definition);
        $this->assertEmpty($definition['props']);
    }

    public function test_action_execution_with_bundle()
    {
        $integration = Integration::factory()->create();
        $action = new TestAppAction($integration);
        
        $bundle = new Bundle(['name' => 'John Doe', 'email' => 'john@example.com']);
        $result = $action->__invoke($bundle);
        
        $this->assertIsArray($result);
        $this->assertTrue($result['success']);
        $this->assertEquals('John Doe', $result['data']);
    }

    public function test_sample_method_returns_empty_array_by_default()
    {
        $integration = Integration::factory()->create();
        $action = new TestAppAction($integration);
        
        $sample = $action->sample();
        
        $this->assertIsArray($sample);
        $this->assertEmpty($sample);
    }

    public function test_action_constructor_sets_integration_and_configuration()
    {
        $integration = Integration::factory()->create();
        $configuration = ['setting1' => 'value1', 'setting2' => 'value2'];
        
        $action = new TestAppAction($integration, $configuration);
        
        // Use reflection to access protected properties
        $reflection = new \ReflectionClass($action);
        
        $integrationProperty = $reflection->getProperty('integration');
        $integrationProperty->setAccessible(true);
        
        $configurationProperty = $reflection->getProperty('configuration');
        $configurationProperty->setAccessible(true);
        
        $this->assertSame($integration, $integrationProperty->getValue($action));
        $this->assertEquals($configuration, $configurationProperty->getValue($action));
    }

    public function test_action_constructor_with_empty_configuration()
    {
        $integration = Integration::factory()->create();
        
        $action = new TestAppAction($integration);
        
        // Use reflection to access protected properties
        $reflection = new \ReflectionClass($action);
        $configurationProperty = $reflection->getProperty('configuration');
        $configurationProperty->setAccessible(true);
        
        $this->assertEquals([], $configurationProperty->getValue($action));
    }

    public function test_props_method_handles_non_field_objects()
    {
        // Create a class with invalid props
        eval('
            namespace Tests\Feature\Unit\Workflows\Automation;
            use App\Workflows\Automation\AppAction;
            use App\Workflows\Automation\Bundle;
            use App\Workflows\Attributes\Action;
            
            #[Action(
                key: "invalid_props_action",
                noun: "Invalid",
                label: "Invalid Props Action",
                description: "An action with invalid props",
                type: "action"
            )]
            class InvalidPropsAppAction extends AppAction
            {
                public static function props(): array
                {
                    return [
                        "not_a_field",
                        null,
                        ["invalid" => "field"],
                    ];
                }
                
                public function __invoke(Bundle $bundle): array
                {
                    return ["success" => true];
                }
            }
        ');
        
        $props = \Tests\Feature\Unit\Workflows\Automation\InvalidPropsAppAction::getProps();
        
        // Should return empty array when no valid Field objects are found
        $this->assertIsArray($props);
        $this->assertEmpty($props);
    }

    public function test_action_definition_structure_consistency()
    {
        $definition = TestAppAction::getDefinition();
        
        // Required keys
        $requiredKeys = ['key', 'noun', 'label', 'description', 'type', 'props', 'class'];
        
        foreach ($requiredKeys as $key) {
            $this->assertArrayHasKey($key, $definition, "Definition missing required key: {$key}");
        }
        
        // Key should be a string
        $this->assertIsString($definition['key']);
        $this->assertNotEmpty($definition['key']);
        
        // Noun should be a string
        $this->assertIsString($definition['noun']);
        $this->assertNotEmpty($definition['noun']);
        
        // Label should be a string
        $this->assertIsString($definition['label']);
        $this->assertNotEmpty($definition['label']);
        
        // Description should be a string
        $this->assertIsString($definition['description']);
        
        // Type should be a string
        $this->assertIsString($definition['type']);
        $this->assertNotEmpty($definition['type']);
        
        // Props should be an array
        $this->assertIsArray($definition['props']);
        
        // Class should be a string and exist
        $this->assertIsString($definition['class']);
        $this->assertTrue(class_exists($definition['class']));
    }
}
