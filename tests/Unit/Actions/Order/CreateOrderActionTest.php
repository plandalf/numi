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
    public function test_it_creates_an_order_from_a_checkout_session(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $checkoutSession = CheckoutSession::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $action = new CreateOrderAction();

        // Act
        $order = $action->execute($checkoutSession);

        // Assert
        $this->assertInstanceOf(Order::class, $order);
        $this->assertEquals($organization->id, $order->organization_id);
        $this->assertEquals($checkoutSession->id, $order->checkout_session_id);
        $this->assertEquals(OrderStatus::PENDING, $order->status);
        $this->assertEquals(0, $order->total_amount);
        $this->assertEquals('USD', $order->currency);
        $this->assertInstanceOf(LazyUuidFromString::class, $order->uuid);
    }

    public function test_it_generates_a_unique_uuid_for_each_order(): void
    {
        // Arrange
        $organization = Organization::factory()->create();
        $checkoutSession = CheckoutSession::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $action = new CreateOrderAction();

        // Act
        $order1 = $action->execute($checkoutSession);
        $order2 = $action->execute($checkoutSession);

        // Assert
        $this->assertInstanceOf(LazyUuidFromString::class, $order1->uuid);
        $this->assertInstanceOf(LazyUuidFromString::class, $order2->uuid);
        $this->assertNotEquals($order1->uuid->toString(), $order2->uuid->toString());
    }
}
