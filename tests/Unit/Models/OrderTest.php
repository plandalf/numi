<?php

namespace Tests\Unit\Models;

use App\Models\Order\Order;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_number_is_automatically_generated_for_new_orders(): void
    {
        // Arrange
        $organization = Organization::factory()->create();

        // Act
        $order = Order::factory()->create([
            'organization_id' => $organization->id,
        ]);

        // Assert
        $this->assertEquals(1, $order->order_number);
    }

    public function test_order_numbers_increment_sequentially_within_organization(): void
    {
        // Arrange
        $organization = Organization::factory()->create();

        // Act - Create multiple orders
        $order1 = Order::factory()->create(['organization_id' => $organization->id]);
        $order2 = Order::factory()->create(['organization_id' => $organization->id]);
        $order3 = Order::factory()->create(['organization_id' => $organization->id]);

        // Assert
        $this->assertEquals(1, $order1->order_number);
        $this->assertEquals(2, $order2->order_number);
        $this->assertEquals(3, $order3->order_number);
    }

    public function test_order_numbers_are_independent_between_organizations(): void
    {
        // Arrange
        $organization1 = Organization::factory()->create();
        $organization2 = Organization::factory()->create();

        // Act - Create orders for different organizations
        $order1 = Order::factory()->create(['organization_id' => $organization1->id]);
        $order2 = Order::factory()->create(['organization_id' => $organization2->id]);
        $order3 = Order::factory()->create(['organization_id' => $organization1->id]);
        $order4 = Order::factory()->create(['organization_id' => $organization2->id]);

        // Assert - Each organization should have its own sequence
        $this->assertEquals(1, $order1->order_number);
        $this->assertEquals(1, $order2->order_number); // Different org, starts at 1
        $this->assertEquals(2, $order3->order_number);
        $this->assertEquals(2, $order4->order_number); // Different org, increments independently
    }

    public function test_order_number_can_be_manually_set(): void
    {
        // Arrange
        $organization = Organization::factory()->create();

        // Act - Create order with explicit order number
        $order = Order::factory()->create([
            'organization_id' => $organization->id,
            'order_number' => 100,
        ]);

        // Assert
        $this->assertEquals(100, $order->order_number);
    }

    public function test_next_order_number_generation_handles_gaps(): void
    {
        // Arrange
        $organization = Organization::factory()->create();

        // Act - Create orders with gaps in numbering
        Order::factory()->create([
            'organization_id' => $organization->id,
            'order_number' => 1,
        ]);
        Order::factory()->create([
            'organization_id' => $organization->id,
            'order_number' => 5, // Gap in sequence
        ]);

        // Create a new order without specifying order_number
        $newOrder = Order::factory()->create([
            'organization_id' => $organization->id,
        ]);

        // Assert - Should continue from the highest number
        $this->assertEquals(6, $newOrder->order_number);
    }

    public function test_generate_next_order_number_static_method(): void
    {
        // Arrange
        $organization = Organization::factory()->create();

        // Act - Test empty organization
        $firstNumber = Order::generateNextOrderNumber($organization->id);

        // Create an order
        Order::factory()->create([
            'organization_id' => $organization->id,
            'order_number' => 1,
        ]);

        $secondNumber = Order::generateNextOrderNumber($organization->id);

        // Assert
        $this->assertEquals(1, $firstNumber);
        $this->assertEquals(2, $secondNumber);
    }
}