<?php

namespace Tests\Unit\Services;

use App\Services\PaymentMethodAmountLimitService;
use PHPUnit\Framework\TestCase;

class PaymentMethodAmountLimitServiceTest extends TestCase
{
    private PaymentMethodAmountLimitService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PaymentMethodAmountLimitService();
    }

    public function test_afterpay_clearpay_usd_limit()
    {
        // Test within limit
        $this->assertTrue($this->service->isPaymentMethodAvailableForAmount('afterpay_clearpay', 200000, 'usd'));
        
        // Test at limit
        $this->assertTrue($this->service->isPaymentMethodAvailableForAmount('afterpay_clearpay', 200000, 'usd'));
        
        // Test over limit
        $this->assertFalse($this->service->isPaymentMethodAvailableForAmount('afterpay_clearpay', 200001, 'usd'));
    }

    public function test_affirm_usd_limit()
    {
        // Test within limit
        $this->assertTrue($this->service->isPaymentMethodAvailableForAmount('affirm', 175000, 'usd'));
        
        // Test over limit
        $this->assertFalse($this->service->isPaymentMethodAvailableForAmount('affirm', 175001, 'usd'));
    }

    public function test_klarna_usd_limit()
    {
        // Test within limit
        $this->assertTrue($this->service->isPaymentMethodAvailableForAmount('klarna', 100000, 'usd'));
        
        // Test over limit
        $this->assertFalse($this->service->isPaymentMethodAvailableForAmount('klarna', 100001, 'usd'));
    }

    public function test_card_has_no_limit()
    {
        // Card should have no limit
        $this->assertTrue($this->service->isPaymentMethodAvailableForAmount('card', 1000000, 'usd'));
        $this->assertTrue($this->service->isPaymentMethodAvailableForAmount('card', 10000000, 'usd'));
    }

    public function test_filter_payment_methods_by_amount()
    {
        $paymentMethods = ['card', 'afterpay_clearpay', 'affirm', 'klarna'];
        $amountInCents = 150000; // $1,500 USD
        
        $filtered = $this->service->filterPaymentMethodsByAmount($paymentMethods, $amountInCents, 'usd');
        
        // At $1,500 USD:
        // - card: no limit (available)
        // - afterpay_clearpay: $2,000 limit (available)
        // - affirm: $1,750 limit (available)
        // - klarna: $1,000 limit (not available)
        $expected = ['card', 'afterpay_clearpay', 'affirm'];
        
        $this->assertEquals($expected, array_values($filtered));
    }

    public function test_filter_payment_methods_by_amount_over_limits()
    {
        $paymentMethods = ['card', 'afterpay_clearpay', 'affirm', 'klarna'];
        $amountInCents = 250000; // $2,500 USD
        
        $filtered = $this->service->filterPaymentMethodsByAmount($paymentMethods, $amountInCents, 'usd');
        
        // At $2,500 USD:
        // - card: no limit (available)
        // - afterpay_clearpay: $2,000 limit (not available)
        // - affirm: $1,750 limit (not available)
        // - klarna: $1,000 limit (not available)
        $expected = ['card'];
        
        $this->assertEquals($expected, array_values($filtered));
    }

    public function test_get_payment_method_limit()
    {
        $this->assertEquals(200000, $this->service->getPaymentMethodLimit('afterpay_clearpay', 'usd'));
        $this->assertEquals(175000, $this->service->getPaymentMethodLimit('affirm', 'usd'));
        $this->assertNull($this->service->getPaymentMethodLimit('card', 'usd'));
    }

    public function test_format_amount_limit()
    {
        $this->assertEquals('$2,000.00', $this->service->formatAmountLimit(200000, 'usd'));
        $this->assertEquals('C$2,500.00', $this->service->formatAmountLimit(250000, 'cad'));
        $this->assertEquals('€1,800.00', $this->service->formatAmountLimit(180000, 'eur'));
    }

    public function test_get_payment_methods_with_limits()
    {
        $methodsWithLimits = $this->service->getPaymentMethodsWithLimits();
        
        $this->assertContains('afterpay_clearpay', $methodsWithLimits);
        $this->assertContains('affirm', $methodsWithLimits);
        $this->assertContains('klarna', $methodsWithLimits);
        $this->assertContains('zip', $methodsWithLimits);
    }
} 