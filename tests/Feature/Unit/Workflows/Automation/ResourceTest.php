<?php

namespace Tests\Feature\Unit\Workflows\Automation;

use App\Workflows\Automation\Resource;
use App\Workflows\Attributes\Resource as ResourceAttribute;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Test resource classes
#[ResourceAttribute(
    key: 'test_resource',
    noun: 'Test',
    label: 'Test Resource',
    description: 'A test resource'
)]
class TestResource extends Resource
{
    public function search(array $query = []): array
    {
        $items = [
            ['id' => '1', 'name' => 'Test Item 1', 'category' => 'A'],
            ['id' => '2', 'name' => 'Test Item 2', 'category' => 'B'],
            ['id' => '3', 'name' => 'Test Item 3', 'category' => 'A'],
        ];

        // Filter by category if provided
        if (isset($query['category'])) {
            $items = array_filter($items, function($item) use ($query) {
                return $item['category'] === $query['category'];
            });
        }

        // Filter by search term if provided
        if (isset($query['search'])) {
            $search = strtolower($query['search']);
            $items = array_filter($items, function($item) use ($search) {
                return str_contains(strtolower($item['name']), $search);
            });
        }

        return array_values($items);
    }

    public function get(string $id): ?array
    {
        $items = [
            '1' => ['id' => '1', 'name' => 'Test Item 1', 'category' => 'A'],
            '2' => ['id' => '2', 'name' => 'Test Item 2', 'category' => 'B'],
            '3' => ['id' => '3', 'name' => 'Test Item 3', 'category' => 'A'],
        ];

        return $items[$id] ?? null;
    }

    public function getValueLabelFields(): array
    {
        return ['value' => 'id', 'label' => 'name'];
    }
}

#[ResourceAttribute(
    key: 'simple_resource',
    noun: 'Simple',
    label: 'Simple Resource',
    description: 'A simple resource'
)]
class SimpleResource extends Resource
{
    public function search(array $query = []): array
    {
        return [
            ['id' => '1', 'name' => 'Simple Item 1'],
            ['id' => '2', 'name' => 'Simple Item 2'],
        ];
    }

    public function get(string $id): ?array
    {
        $items = [
            '1' => ['id' => '1', 'name' => 'Simple Item 1'],
            '2' => ['id' => '2', 'name' => 'Simple Item 2'],
        ];

        return $items[$id] ?? null;
    }

    public function getValueLabelFields(): array
    {
        return ['value' => 'id', 'label' => 'name'];
    }
}

class ResourceTest extends TestCase
{
    public function test_get_metadata_from_resource_attribute()
    {
        $metadata = TestResource::getMetadata();
        
        $this->assertEquals('test_resource', $metadata['key']);
        $this->assertEquals('Test', $metadata['noun']);
        $this->assertEquals('Test Resource', $metadata['label']);
        $this->assertEquals('A test resource', $metadata['description']);
    }

    public function test_get_metadata_throws_exception_without_resource_attribute()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Resource must have a Resource attribute');
        
        // Create a class without the Resource attribute
        eval('
            namespace Tests\Feature\Unit\Workflows\Automation;
            use App\Workflows\Automation\Resource;
            
            class InvalidResource extends Resource
            {
                public function search(array $query = []): array
                {
                    return [];
                }
                
                public function get(string $id): ?array
                {
                    return null;
                }
                
                public function getValueLabelFields(): array
                {
                    return [];
                }
            }
        ');
        
        $invalidClass = 'Tests\Feature\Unit\Workflows\Automation\InvalidResource';
        $invalidClass::getMetadata();
    }

    public function test_get_definition_combines_metadata()
    {
        $definition = TestResource::getDefinition();
        
        $this->assertIsArray($definition);
        $this->assertArrayHasKey('key', $definition);
        $this->assertArrayHasKey('noun', $definition);
        $this->assertArrayHasKey('label', $definition);
        $this->assertArrayHasKey('description', $definition);
        $this->assertArrayHasKey('class', $definition);
        
        $this->assertEquals('test_resource', $definition['key']);
        $this->assertEquals('Test', $definition['noun']);
        $this->assertEquals('Test Resource', $definition['label']);
        $this->assertEquals('A test resource', $definition['description']);
        $this->assertEquals(TestResource::class, $definition['class']);
    }

    public function test_search_without_query_parameters()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $results = $resource->search();
        
        $this->assertIsArray($results);
        $this->assertCount(3, $results);
        
        // Check first item structure
        $firstItem = $results[0];
        $this->assertArrayHasKey('id', $firstItem);
        $this->assertArrayHasKey('name', $firstItem);
        $this->assertArrayHasKey('category', $firstItem);
    }

    public function test_search_with_category_filter()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $results = $resource->search(['category' => 'A']);
        
        $this->assertIsArray($results);
        $this->assertCount(2, $results);
        
        foreach ($results as $item) {
            $this->assertEquals('A', $item['category']);
        }
    }

    public function test_search_with_search_term()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $results = $resource->search(['search' => 'Item 1']);
        
        $this->assertIsArray($results);
        $this->assertCount(1, $results);
        $this->assertEquals('Test Item 1', $results[0]['name']);
    }

    public function test_search_with_multiple_filters()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $results = $resource->search([
            'category' => 'A',
            'search' => 'Item 1'
        ]);
        
        $this->assertIsArray($results);
        $this->assertCount(1, $results);
        $this->assertEquals('Test Item 1', $results[0]['name']);
        $this->assertEquals('A', $results[0]['category']);
    }

    public function test_get_existing_item()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $item = $resource->get('1');
        
        $this->assertIsArray($item);
        $this->assertEquals('1', $item['id']);
        $this->assertEquals('Test Item 1', $item['name']);
        $this->assertEquals('A', $item['category']);
    }

    public function test_get_nonexistent_item()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $item = $resource->get('999');
        
        $this->assertNull($item);
    }

    public function test_get_value_label_fields()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $fields = $resource->getValueLabelFields();
        
        $this->assertIsArray($fields);
        $this->assertArrayHasKey('value', $fields);
        $this->assertArrayHasKey('label', $fields);
        $this->assertEquals('id', $fields['value']);
        $this->assertEquals('name', $fields['label']);
    }

    public function test_resource_constructor_sets_integration()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        // Use reflection to access protected properties
        $reflection = new \ReflectionClass($resource);
        $integrationProperty = $reflection->getProperty('integration');
        $integrationProperty->setAccessible(true);
        
        $this->assertSame($integration, $integrationProperty->getValue($resource));
    }

    public function test_simple_resource_functionality()
    {
        $integration = Integration::factory()->create();
        $resource = new SimpleResource($integration);
        
        // Test search
        $searchResults = $resource->search();
        $this->assertCount(2, $searchResults);
        
        // Test get
        $item = $resource->get('1');
        $this->assertIsArray($item);
        $this->assertEquals('Simple Item 1', $item['name']);
        
        // Test getValueLabelFields
        $fields = $resource->getValueLabelFields();
        $this->assertEquals('id', $fields['value']);
        $this->assertEquals('name', $fields['label']);
    }

    public function test_resource_definition_structure_consistency()
    {
        $definition = TestResource::getDefinition();
        
        // Required keys
        $requiredKeys = ['key', 'noun', 'label', 'description', 'class'];
        
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
        
        // Class should be a string and exist
        $this->assertIsString($definition['class']);
        $this->assertTrue(class_exists($definition['class']));
    }

    public function test_search_results_structure()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $results = $resource->search();
        
        $this->assertIsArray($results);
        $this->assertNotEmpty($results);
        
        foreach ($results as $item) {
            $this->assertIsArray($item);
            $this->assertArrayHasKey('id', $item);
            $this->assertArrayHasKey('name', $item);
            $this->assertArrayHasKey('category', $item);
            
            // ID should be a string
            $this->assertIsString($item['id']);
            $this->assertNotEmpty($item['id']);
            
            // Name should be a string
            $this->assertIsString($item['name']);
            $this->assertNotEmpty($item['name']);
            
            // Category should be a string
            $this->assertIsString($item['category']);
        }
    }

    public function test_get_item_structure()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $item = $resource->get('1');
        
        $this->assertIsArray($item);
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('category', $item);
        
        // ID should be a string
        $this->assertIsString($item['id']);
        $this->assertEquals('1', $item['id']);
        
        // Name should be a string
        $this->assertIsString($item['name']);
        $this->assertNotEmpty($item['name']);
        
        // Category should be a string
        $this->assertIsString($item['category']);
    }

    public function test_value_label_fields_consistency()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        $fields = $resource->getValueLabelFields();
        
        $this->assertIsArray($fields);
        $this->assertArrayHasKey('value', $fields);
        $this->assertArrayHasKey('label', $fields);
        
        // Value field should be a string
        $this->assertIsString($fields['value']);
        $this->assertNotEmpty($fields['value']);
        
        // Label field should be a string
        $this->assertIsString($fields['label']);
        $this->assertNotEmpty($fields['label']);
    }

    public function test_search_with_empty_results()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        // Search for a category that doesn't exist
        $results = $resource->search(['category' => 'Z']);
        
        $this->assertIsArray($results);
        $this->assertEmpty($results);
    }

    public function test_search_with_case_insensitive_search()
    {
        $integration = Integration::factory()->create();
        $resource = new TestResource($integration);
        
        // Test case insensitive search
        $results = $resource->search(['search' => 'item 1']);
        
        $this->assertIsArray($results);
        $this->assertCount(1, $results);
        $this->assertEquals('Test Item 1', $results[0]['name']);
    }
}
