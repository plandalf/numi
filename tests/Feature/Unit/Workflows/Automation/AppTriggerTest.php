<?php

namespace Tests\Feature\Unit\Workflows\Automation;

use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Field;
use App\Workflows\Automation\Bundle;
use App\Workflows\Attributes\Trigger;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Test trigger classes
#[Trigger(
    key: 'test_trigger',
    noun: 'Test',
    label: 'Test Trigger',
    description: 'A test trigger'
)]
class TestAppTrigger extends AppTrigger
{
    public static function props(): array
    {
        return [
            Field::text('event', 'Event', 'Enter an event'),
            Field::select('type', 'Type', 'Select type', [
                ['value' => 'webhook', 'label' => 'Webhook'],
                ['value' => 'polling', 'label' => 'Polling'],
            ]),
            Field::resource('offer', 'Offer', 'Select an offer', 'offer'),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        return ['success' => true, 'event' => $bundle->get('event')];
    }

    public function subscribe(Bundle $bundle): void
    {
        // Test subscription logic
    }

    public function unsubscribe(Bundle $bundle): void
    {
        // Test unsubscription logic
    }
}

#[Trigger(
    key: 'simple_trigger',
    noun: 'Simple',
    label: 'Simple Trigger',
    description: 'A simple trigger without props'
)]
class SimpleAppTrigger extends AppTrigger
{
    public function __invoke(Bundle $bundle): array
    {
        return ['success' => true];
    }
}

class AppTriggerTest extends TestCase
{
    public function test_get_metadata_from_trigger_attribute()
    {
        $metadata = TestAppTrigger::getMetadata();
        
        $this->assertEquals('test_trigger', $metadata['key']);
        $this->assertEquals('Test', $metadata['noun']);
        $this->assertEquals('Test Trigger', $metadata['label']);
        $this->assertEquals('A test trigger', $metadata['description']);
    }

    public function test_get_metadata_throws_exception_without_trigger_attribute()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('AppTrigger must have a Trigger attribute');
        
        // Create a class without the Trigger attribute
        eval('
            namespace Tests\Feature\Unit\Workflows\Automation;
            use App\Workflows\Automation\AppTrigger;
            use App\Workflows\Automation\Bundle;
            
            class InvalidAppTrigger extends AppTrigger
            {
                public function __invoke(Bundle $bundle): array
                {
                    return ["success" => true];
                }
            }
        ');
        
        $invalidClass = 'Tests\Feature\Unit\Workflows\Automation\InvalidAppTrigger';
        $invalidClass::getMetadata();
    }

    public function test_get_props_with_defined_props_method()
    {
        $props = TestAppTrigger::getProps();
        
        $this->assertIsArray($props);
        $this->assertCount(3, $props);
        
        // Check event field
        $this->assertArrayHasKey('event', $props);
        $this->assertEquals('text', $props['event']['type']);
        $this->assertEquals('Event', $props['event']['label']);
        $this->assertEquals('Enter an event', $props['event']['description']);
        
        // Check type field
        $this->assertArrayHasKey('type', $props);
        $this->assertEquals('select', $props['type']['type']);
        $this->assertEquals('Type', $props['type']['label']);
        $this->assertEquals('Select type', $props['type']['description']);
        $this->assertArrayHasKey('options', $props['type']);
        
        // Check offer field
        $this->assertArrayHasKey('offer', $props);
        $this->assertEquals('resource', $props['offer']['type']);
        $this->assertEquals('Offer', $props['offer']['label']);
        $this->assertEquals('Select an offer', $props['offer']['description']);
        $this->assertEquals('offer', $props['offer']['resource']);
    }

    public function test_get_props_without_props_method()
    {
        $props = SimpleAppTrigger::getProps();
        
        $this->assertIsArray($props);
        $this->assertEmpty($props);
    }

    public function test_get_definition_combines_metadata_and_props()
    {
        $definition = TestAppTrigger::getDefinition();
        
        $this->assertIsArray($definition);
        $this->assertArrayHasKey('key', $definition);
        $this->assertArrayHasKey('noun', $definition);
        $this->assertArrayHasKey('label', $definition);
        $this->assertArrayHasKey('description', $definition);
        $this->assertArrayHasKey('props', $definition);
        $this->assertArrayHasKey('class', $definition);
        
        $this->assertEquals('test_trigger', $definition['key']);
        $this->assertEquals('Test', $definition['noun']);
        $this->assertEquals('Test Trigger', $definition['label']);
        $this->assertEquals('A test trigger', $definition['description']);
        $this->assertEquals(TestAppTrigger::class, $definition['class']);
        
        // Props should be included
        $this->assertIsArray($definition['props']);
        $this->assertCount(3, $definition['props']);
    }

    public function test_get_definition_without_props()
    {
        $definition = SimpleAppTrigger::getDefinition();
        
        $this->assertIsArray($definition);
        $this->assertArrayHasKey('props', $definition);
        $this->assertEmpty($definition['props']);
    }

    public function test_trigger_execution_with_bundle()
    {
        $integration = Integration::factory()->create();
        $trigger = new TestAppTrigger($integration);
        
        $bundle = new Bundle(['event' => 'purchase_completed', 'type' => 'webhook']);
        $result = $trigger->__invoke($bundle);
        
        $this->assertIsArray($result);
        $this->assertTrue($result['success']);
        $this->assertEquals('purchase_completed', $result['event']);
    }

    public function test_subscribe_and_unsubscribe_methods()
    {
        $integration = Integration::factory()->create();
        $trigger = new TestAppTrigger($integration);
        
        $bundle = new Bundle(['event' => 'purchase_completed']);
        
        // These should not throw exceptions
        $this->assertNull($trigger->subscribe($bundle));
        $this->assertNull($trigger->unsubscribe($bundle));
    }

    public function test_trigger_constructor_sets_integration_and_configuration()
    {
        $integration = Integration::factory()->create();
        $configuration = ['setting1' => 'value1', 'setting2' => 'value2'];
        
        $trigger = new TestAppTrigger($integration, $configuration);
        
        // Use reflection to access protected properties
        $reflection = new \ReflectionClass($trigger);
        
        $integrationProperty = $reflection->getProperty('integration');
        $integrationProperty->setAccessible(true);
        
        $configurationProperty = $reflection->getProperty('configuration');
        $configurationProperty->setAccessible(true);
        
        $this->assertSame($integration, $integrationProperty->getValue($trigger));
        $this->assertEquals($configuration, $configurationProperty->getValue($trigger));
    }

    public function test_trigger_constructor_with_empty_configuration()
    {
        $integration = Integration::factory()->create();
        
        $trigger = new TestAppTrigger($integration);
        
        // Use reflection to access protected properties
        $reflection = new \ReflectionClass($trigger);
        $configurationProperty = $reflection->getProperty('configuration');
        $configurationProperty->setAccessible(true);
        
        $this->assertEquals([], $configurationProperty->getValue($trigger));
    }

    public function test_props_method_handles_non_field_objects()
    {
        // Create a class with invalid props
        eval('
            namespace Tests\Feature\Unit\Workflows\Automation;
            use App\Workflows\Automation\AppTrigger;
            use App\Workflows\Automation\Bundle;
            use App\Workflows\Attributes\Trigger;
            
            #[Trigger(
                key: "invalid_props_trigger",
                noun: "Invalid",
                label: "Invalid Props Trigger",
                description: "A trigger with invalid props"
            )]
            class InvalidPropsAppTrigger extends AppTrigger
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
        
        $props = \Tests\Feature\Unit\Workflows\Automation\InvalidPropsAppTrigger::getProps();
        
        // Should return empty array when no valid Field objects are found
        $this->assertIsArray($props);
        $this->assertEmpty($props);
    }

    public function test_trigger_definition_structure_consistency()
    {
        $definition = TestAppTrigger::getDefinition();
        
        // Required keys
        $requiredKeys = ['key', 'noun', 'label', 'description', 'props', 'class'];
        
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
        
        // Props should be an array
        $this->assertIsArray($definition['props']);
        
        // Class should be a string and exist
        $this->assertIsString($definition['class']);
        $this->assertTrue(class_exists($definition['class']));
    }

    public function test_trigger_with_resource_field()
    {
        $props = TestAppTrigger::getProps();
        
        $this->assertArrayHasKey('offer', $props);
        $offerField = $props['offer'];
        
        $this->assertEquals('resource', $offerField['type']);
        $this->assertEquals('Offer', $offerField['label']);
        $this->assertEquals('Select an offer', $offerField['description']);
        $this->assertEquals('offer', $offerField['resource']);
    }

    public function test_trigger_subscription_lifecycle()
    {
        $integration = Integration::factory()->create();
        $trigger = new TestAppTrigger($integration);
        
        $bundle = new Bundle(['event' => 'purchase_completed']);
        
        // Test subscription
        $this->assertNull($trigger->subscribe($bundle));
        
        // Test execution
        $result = $trigger->__invoke($bundle);
        $this->assertTrue($result['success']);
        
        // Test unsubscription
        $this->assertNull($trigger->unsubscribe($bundle));
    }

    public function test_trigger_with_complex_bundle_data()
    {
        $integration = Integration::factory()->create();
        $trigger = new TestAppTrigger($integration);
        
        $complexData = [
            'event' => 'purchase_completed',
            'type' => 'webhook',
            'offer' => 'offer_123',
            'customer' => [
                'id' => 'cust_456',
                'email' => 'test@example.com',
            ],
            'metadata' => [
                'source' => 'kajabi',
                'timestamp' => time(),
            ],
        ];
        
        $bundle = new Bundle($complexData);
        $result = $trigger->__invoke($bundle);
        
        $this->assertIsArray($result);
        $this->assertTrue($result['success']);
        $this->assertEquals('purchase_completed', $result['event']);
    }
}
