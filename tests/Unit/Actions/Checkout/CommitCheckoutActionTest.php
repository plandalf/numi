<?php

namespace Tests\Unit\Actions\Checkout;

use App\Actions\Checkout\CommitCheckoutAction;
use App\Actions\Order\CreateOrderAction;
use App\Actions\Order\CreateOrderItemAction;
use App\Enums\CheckoutSessionStatus;
use App\Enums\OrderStatus;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class CommitCheckoutActionTest extends TestCase
{
    use RefreshDatabase;

    private CommitCheckoutAction $action;
    private $createOrderAction;
    private $createOrderItemAction;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock the dependencies
        $this->createOrderAction = Mockery::mock(CreateOrderAction::class);
        $this->createOrderItemAction = Mockery::mock(CreateOrderItemAction::class);

        $this->action = new CommitCheckoutAction(
            $this->createOrderAction,
            $this->createOrderItemAction
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_it_completes_checkout_session(): void
    {
        // Arrange
        $checkoutSession = CheckoutSession::factory()->create([
            'status' => CheckoutSessionStatus::STARTED,
        ]);

        $lineItems = CheckoutLineItem::factory(2)->create([
            'checkout_session_id' => $checkoutSession->id,
            'organization_id' => $checkoutSession->organization_id,
        ]);

        $order = Order::factory()->create([
            'organization_id' => $checkoutSession->organization_id,
            'checkout_session_id' => $checkoutSession->id,
            'status' => OrderStatus::PENDING,
            'total_amount' => 0,
        ]);

        // Mock CreateOrderAction
        $this->createOrderAction
            ->expects('execute')
            ->once()
            ->with(Mockery::type(CheckoutSession::class))
            ->andReturn($order);

        // Mock CreateOrderItemAction for each line item
        foreach ($lineItems as $lineItem) {
            $this->createOrderItemAction
                ->expects('execute')
                ->once()
                ->with(
                    Mockery::type(Order::class),
                    Mockery::type(CheckoutLineItem::class)
                )
                ->andReturnUsing(function ($order, $lineItem) {
                    return OrderItem::factory()->create([
                        'order_id' => $order->id,
                        'organization_id' => $order->organization_id,
                        'price_id' => $lineItem->price_id,
                        'slot_id' => $lineItem->slot_id,
                        'quantity' => $lineItem->quantity,
                        'total_amount' => $lineItem->total_amount,
                    ]);
                });
        }

        // Act
        $result = $this->action->execute($checkoutSession);

        // Assert
        $this->assertInstanceOf(CheckoutSession::class, $result);
        $this->assertEquals(CheckoutSessionStatus::CLOSED, $result->status);
        $this->assertNotNull($result->finalized_at);
    }

    public function test_it_returns_checkout_session_without_creating_order_if_already_closed(): void
    {
        // Arrange
        $checkoutSession = CheckoutSession::factory()->create([
            'status' => CheckoutSessionStatus::CLOSED,
        ]);

        // Mock CreateOrderAction - it should not be called
        $this->createOrderAction
            ->expects('execute')
            ->never();

        // Act
        $result = $this->action->execute($checkoutSession);

        // Assert
        $this->assertInstanceOf(CheckoutSession::class, $result);
        $this->assertEquals(CheckoutSessionStatus::CLOSED, $result->status);
    }
}
