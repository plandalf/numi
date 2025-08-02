<?php

namespace Tests\Unit\Resources;

use App\Http\Resources\OrderResource;
use App\Models\Order\Order;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_resource_includes_organization_when_loaded(): void
    {
        // Arrange
        $organization = Organization::factory()->create(['name' => 'Test Organization']);
        $order = Order::factory()->create(['organization_id' => $organization->id]);
        $order->load('organization');

        // Act
        $resource = new OrderResource($order);
        $data = $resource->toArray(request());

        // Assert
        $this->assertArrayHasKey('organization', $data);
        $this->assertEquals('Test Organization', $data['organization']['name']);
        $this->assertEquals($organization->id, $data['organization']['id']);
    }

    public function test_order_resource_includes_order_number(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $order = Order::factory()->create([
            'organization_id' => $organization->id,
            'order_number' => 42,
        ]);

        // Act
        $resource = new OrderResource($order);
        $data = $resource->toArray(request());

        // Assert
        $this->assertArrayHasKey('order_number', $data);
        $this->assertEquals(42, $data['order_number']);
    }
}