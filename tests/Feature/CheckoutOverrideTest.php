<?php

namespace Tests\Feature;

use App\Enums\ChargeType;
use App\Models\Catalog\Price;
use App\Models\Catalog\Product;
use App\Models\Organization;
use App\Models\Store\Offer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutOverrideTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Organization $organization;
    private Offer $offer;
    private Product $product;
    private Price $parentPrice;
    private Price $childPriceMonthly;
    private Price $childPriceYearly;
    private Price $childPriceEur;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->organization = Organization::factory()->create();
        $this->user->organizations()->attach($this->organization->id, ['role' => 'owner']);
        
        $this->offer = Offer::factory()->create([
            'organization_id' => $this->organization->id,
            'status' => 'published',
        ]);

        $this->product = Product::factory()->create([
            'organization_id' => $this->organization->id,
        ]);

        // Create parent price (list price)
        $this->parentPrice = Price::factory()->create([
            'organization_id' => $this->organization->id,
            'product_id' => $this->product->id,
            'scope' => 'list',
            'type' => ChargeType::RECURRING,
            'lookup_key' => 'parent-price-key',
            'amount' => 1000, // $10.00
            'currency' => 'USD',
            'renew_interval' => 'month',
            'is_active' => true,
        ]);

        // Create child price with monthly interval
        $this->childPriceMonthly = Price::factory()->create([
            'organization_id' => $this->organization->id,
            'product_id' => $this->product->id,
            'parent_list_price_id' => $this->parentPrice->id,
            'scope' => 'custom',
            'type' => ChargeType::RECURRING,
            'amount' => 1200, // $12.00
            'currency' => 'USD',
            'renew_interval' => 'month',
            'is_active' => true,
        ]);

        // Create child price with yearly interval
        $this->childPriceYearly = Price::factory()->create([
            'organization_id' => $this->organization->id,
            'product_id' => $this->product->id,
            'parent_list_price_id' => $this->parentPrice->id,
            'scope' => 'custom',
            'type' => ChargeType::RECURRING,
            'amount' => 10000, // $100.00
            'currency' => 'USD',
            'renew_interval' => 'year',
            'is_active' => true,
        ]);

        // Create child price with EUR currency
        $this->childPriceEur = Price::factory()->create([
            'organization_id' => $this->organization->id,
            'product_id' => $this->product->id,
            'parent_list_price_id' => $this->parentPrice->id,
            'scope' => 'custom',
            'type' => ChargeType::RECURRING,
            'amount' => 900, // €9.00
            'currency' => 'EUR',
            'renew_interval' => 'month',
            'is_active' => true,
        ]);
    }

    public function test_checkout_without_overrides_uses_original_price()
    {
        $response = $this->get("/o/{$this->offer->getRouteKey()}?items[0][lookup_key]={$this->parentPrice->lookup_key}&items[0][quantity]=1");

        $response->assertRedirect();
        
        // Verify checkout session was created with original price
        $this->assertDatabaseHas('checkout_sessions', [
            'offer_id' => $this->offer->id,
            'organization_id' => $this->organization->id,
        ]);

        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $this->parentPrice->id,
        ]);
    }

    public function test_checkout_with_interval_override_uses_child_price()
    {
        $response = $this->get("/o/{$this->offer->getRouteKey()}?interval=year&items[0][lookup_key]={$this->parentPrice->lookup_key}&items[0][quantity]=1");

        $response->assertRedirect();
        
        // Verify checkout session was created with yearly child price
        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $this->childPriceYearly->id,
        ]);
    }

    public function test_checkout_with_currency_override_uses_child_price()
    {
        $response = $this->get("/o/{$this->offer->getRouteKey()}?currency=eur&items[0][lookup_key]={$this->parentPrice->lookup_key}&items[0][quantity]=1");

        $response->assertRedirect();
        
        // Verify checkout session was created with EUR child price
        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $this->childPriceEur->id,
        ]);
    }

    public function test_checkout_with_both_interval_and_currency_override()
    {
        // Create a child price with both year interval and EUR currency
        $childPriceYearlyEur = Price::factory()->create([
            'organization_id' => $this->organization->id,
            'product_id' => $this->product->id,
            'parent_list_price_id' => $this->parentPrice->id,
            'scope' => 'custom',
            'type' => ChargeType::RECURRING,
            'amount' => 9000, // €90.00
            'currency' => 'EUR',
            'renew_interval' => 'year',
            'is_active' => true,
        ]);

        $response = $this->get("/o/{$this->offer->getRouteKey()}?interval=year&currency=eur&items[0][lookup_key]={$this->parentPrice->lookup_key}&items[0][quantity]=1");

        $response->assertRedirect();
        
        // Verify checkout session was created with yearly EUR child price
        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $childPriceYearlyEur->id,
        ]);
    }

    public function test_checkout_with_override_but_no_matching_child_price_uses_parent()
    {
        $response = $this->get("/o/{$this->offer->getRouteKey()}?interval=week&items[0][lookup_key]={$this->parentPrice->lookup_key}&items[0][quantity]=1");

        $response->assertRedirect();
        
        // Verify checkout session was created with original parent price (no weekly child exists)
        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $this->parentPrice->id,
        ]);
    }

    public function test_checkout_with_inactive_child_price_uses_parent()
    {
        // Make the yearly child price inactive
        $this->childPriceYearly->update(['is_active' => false]);

        $response = $this->get("/o/{$this->offer->getRouteKey()}?interval=year&items[0][lookup_key]={$this->parentPrice->lookup_key}&items[0][quantity]=1");

        $response->assertRedirect();
        
        // Verify checkout session was created with original parent price
        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $this->parentPrice->id,
        ]);
    }

    public function test_checkout_with_empty_items_skips_override_processing()
    {
        $response = $this->get("/o/{$this->offer->getRouteKey()}?interval=year&currency=eur");

        $response->assertRedirect();
        
        // Verify checkout session was created without any line items
        $this->assertDatabaseHas('checkout_sessions', [
            'offer_id' => $this->offer->id,
            'organization_id' => $this->organization->id,
        ]);

        $this->assertDatabaseMissing('checkout_line_items', [
            'price_id' => $this->childPriceYearly->id,
        ]);
    }

    public function test_checkout_with_invalid_lookup_key_returns_error()
    {
        $response = $this->get("/o/{$this->offer->getRouteKey()}?items[0][lookup_key]=invalid-key&items[0][quantity]=1");

        // Since we're testing via HTTP, we'll get a JSON response with error
        $response->assertStatus(200);
        $response->assertJson([
            'items' => ["Price with lookup_key 'invalid-key' not found"],
        ]);
    }

    public function test_checkout_with_multiple_items_applies_overrides_to_all()
    {
        // Create a second parent price
        $secondParentPrice = Price::factory()->create([
            'organization_id' => $this->organization->id,
            'product_id' => $this->product->id,
            'scope' => 'list',
            'type' => ChargeType::RECURRING,
            'lookup_key' => 'second-price-key',
            'amount' => 2000, // $20.00
            'currency' => 'USD',
            'renew_interval' => 'month',
            'is_active' => true,
        ]);

        // Create child price for second parent
        $secondChildPriceYearly = Price::factory()->create([
            'organization_id' => $this->organization->id,
            'product_id' => $this->product->id,
            'parent_list_price_id' => $secondParentPrice->id,
            'scope' => 'custom',
            'type' => ChargeType::RECURRING,
            'amount' => 20000, // $200.00
            'currency' => 'USD',
            'renew_interval' => 'year',
            'is_active' => true,
        ]);

        $response = $this->get("/o/{$this->offer->getRouteKey()}?interval=year&items[0][lookup_key]={$this->parentPrice->lookup_key}&items[0][quantity]=1&items[1][lookup_key]={$secondParentPrice->lookup_key}&items[1][quantity]=1");

        $response->assertRedirect();
        
        // Verify both items used their yearly child prices
        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $this->childPriceYearly->id,
        ]);

        $this->assertDatabaseHas('checkout_line_items', [
            'price_id' => $secondChildPriceYearly->id,
        ]);
    }

    public function test_checkout_requires_lookup_key_in_items()
    {
        $response = $this->get("/o/{$this->offer->getRouteKey()}?items[0][quantity]=1");

        // Validation errors cause redirect with session errors
        $response->assertRedirect();
        $response->assertSessionHasErrors(['items']);
    }
}