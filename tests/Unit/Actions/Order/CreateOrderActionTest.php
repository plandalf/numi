<?php

namespace Tests\Unit\Actions\Order;

use App\Actions\Order\CreateOrderAction;
use App\Enums\OrderStatus;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use App\Models\Organization;
use Ramsey\Uuid\Lazy\LazyUuidFromString;
use Tests\TestCase;

class CreateOrderActionTest extends TestCase
{
    public function test_it_returns_existing_order_if_one_exists_for_checkout_session(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $checkoutSession = CheckoutSession::factory()->create([
            'organization_id' => $organization->id,
        ]);

        // Create an existing order for this checkout session
        $existingOrder = Order::factory()->create([
            'organization_id' => $organization->id,
            'checkout_session_id' => $checkoutSession->id,
        ]);

        $action = new CreateOrderAction();

        // Act
        $order = $action($checkoutSession);

        // Assert
        $this->assertEquals($existingOrder->id, $order->id);
        $this->assertEquals($existingOrder->uuid, $order->uuid);
    }

    public function test_it_uses_update_or_create_to_handle_unique_constraint(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $checkoutSession = CheckoutSession::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $action = new CreateOrderAction();

        // Act - First call creates a new order
        $order1 = $action($checkoutSession);

        // Act - Second call should return the same order
        $order2 = $action($checkoutSession);

        // Assert
        $this->assertEquals($order1->id, $order2->id);
        $this->assertEquals($order1->uuid, $order2->uuid);

        // Verify only one order exists in the database
        $this->assertEquals(1, Order::where('organization_id', $organization->id)
            ->where('checkout_session_id', $checkoutSession->id)
            ->count());
    }
}
