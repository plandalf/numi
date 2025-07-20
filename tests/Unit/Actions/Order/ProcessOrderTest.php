<?php

namespace Tests\Unit\Actions\Order;

use App\Actions\Order\ProcessOrderAction;
use App\Enums\ChargeType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Checkout\CheckoutLineItem;
use App\Models\Checkout\CheckoutSession;
use App\Models\Customer;
use App\Models\Integration;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\Organization;
use App\Models\PaymentMethod;
use App\Modules\Integrations\Stripe\Stripe;
use App\Services\PaymentValidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ProcessOrderTest extends TestCase
{
    use RefreshDatabase;

    private ProcessOrderAction $processOrder;
    private Organization $organization;
    private Integration $integration;
    private CheckoutSession $checkoutSession;
    private Order $order;
    private Product $product;
    private Price $price;

    protected function setUp(): void
    {
        parent::setUp();

        $this->organization = Organization::factory()->create();
        $this->integration = Integration::factory()->create([
            'organization_id' => $this->organization->id,
            'type' => 'stripe',
        ]);

        $this->product = Product::factory()->create([
            'organization_id' => $this->organization->id,
        ]);

        $this->price = Price::factory()->create([
            'product_id' => $this->product->id,
            'type' => ChargeType::ONE_TIME,
            'amount' => 1000, // $10.00
            'currency' => 'usd',
        ]);

        $this->checkoutSession = CheckoutSession::factory()->create([
            'organization_id' => $this->organization->id,
            'integration_id' => $this->integration->id,
        ]);

        $this->order = Order::factory()->create([
            'organization_id' => $this->organization->id,
            'checkout_session_id' => $this->checkoutSession->id,
        ]);

        // Mock the dependencies
        $paymentValidationService = Mockery::mock(PaymentValidationService::class);
        $autoFulfillOrderAction = Mockery::mock('App\Actions\Fulfillment\AutoFulfillOrderAction');
        $sendOrderNotificationAction = Mockery::mock('App\Actions\Fulfillment\SendOrderNotificationAction');

        $this->processOrder = new ProcessOrderAction(
            $paymentValidationService,
            $autoFulfillOrderAction,
            $sendOrderNotificationAction
        );
    }

    public function test_throws_exception_when_customer_not_found()
    {
        // Create order item
        OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'price_id' => $this->price->id,
            'quantity' => 1,
        ]);

        // Don't create a customer - this should cause an exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Customer is required for payment processing. Please ensure customer information is provided during checkout.');

        ($this->processOrder)($this->order, $this->checkoutSession, 'test_confirmation_token');
    }

    public function test_uses_existing_customer_from_checkout_session()
    {
        // Create customer
        $customer = Customer::factory()->create([
            'organization_id' => $this->organization->id,
            'integration_id' => $this->integration->id,
            'reference_id' => 'cus_test123',
        ]);

        // Associate customer with checkout session
        $this->checkoutSession->update(['customer_id' => $customer->id]);

        // Create order item
        OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'price_id' => $this->price->id,
            'quantity' => 1,
        ]);

        // Mock the Stripe integration
        $stripeMock = Mockery::mock(Stripe::class);
        $stripeMock->shouldReceive('createDirectPaymentIntent')
            ->once()
            ->andReturn((object) [
                'id' => 'pi_test123',
                'status' => 'succeeded',
                'payment_method' => 'pm_test123',
            ]);

        // Mock the checkout session to return the Stripe integration
        $this->checkoutSession->shouldReceive('integrationClient')
            ->andReturn($stripeMock);

        // Mock payment validation
        $paymentValidationService = Mockery::mock(PaymentValidationService::class);
        $paymentValidationService->shouldReceive('validateOneTimePayment')
            ->andReturn(['is_valid' => true]);

        $autoFulfillOrderAction = Mockery::mock('App\Actions\Fulfillment\AutoFulfillOrderAction');
        $sendOrderNotificationAction = Mockery::mock('App\Actions\Fulfillment\SendOrderNotificationAction');

        $processOrder = new ProcessOrderAction(
            $paymentValidationService,
            $autoFulfillOrderAction,
            $sendOrderNotificationAction
        );

        // This should not throw an exception since customer exists
        $result = ($processOrder)($this->order, $this->checkoutSession, 'test_confirmation_token');

        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals($customer->id, $result->customer_id);
    }

    public function test_updates_payment_method_external_id_after_payment_intent_creation()
    {
        // Create customer
        $customer = Customer::factory()->create([
            'organization_id' => $this->organization->id,
            'integration_id' => $this->integration->id,
            'reference_id' => 'cus_test123',
        ]);

        // Create payment method with temporary external_id
        $paymentMethod = PaymentMethod::factory()->create([
            'customer_id' => $customer->id,
            'organization_id' => $this->organization->id,
            'integration_id' => $this->integration->id,
            'external_id' => 'temp_' . uniqid(),
            'type' => 'card',
        ]);

        // Associate customer and payment method with checkout session
        $this->checkoutSession->update([
            'customer_id' => $customer->id,
            'payment_method_id' => $paymentMethod->id,
        ]);

        // Create order item
        OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'price_id' => $this->price->id,
            'quantity' => 1,
        ]);

        // Mock the Stripe integration
        $stripeMock = Mockery::mock(Stripe::class);
        $stripeMock->shouldReceive('createDirectPaymentIntent')
            ->once()
            ->andReturn((object) [
                'id' => 'pi_test123',
                'status' => 'succeeded',
                'payment_method' => 'pm_test123',
            ]);

        // Mock the checkout session to return the Stripe integration
        $this->checkoutSession->shouldReceive('integrationClient')
            ->andReturn($stripeMock);

        // Mock payment validation
        $paymentValidationService = Mockery::mock(PaymentValidationService::class);
        $paymentValidationService->shouldReceive('validateOneTimePayment')
            ->andReturn(['is_valid' => true]);

        $autoFulfillOrderAction = Mockery::mock('App\Actions\Fulfillment\AutoFulfillOrderAction');
        $sendOrderNotificationAction = Mockery::mock('App\Actions\Fulfillment\SendOrderNotificationAction');

        $processOrder = new ProcessOrderAction(
            $paymentValidationService,
            $autoFulfillOrderAction,
            $sendOrderNotificationAction
        );

        // Process the order
        ($processOrder)($this->order, $this->checkoutSession, 'test_confirmation_token');

        // Verify that the payment method's external_id was updated
        $paymentMethod->refresh();
        $this->assertEquals('pm_test123', $paymentMethod->external_id);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
