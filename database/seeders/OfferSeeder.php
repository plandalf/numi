<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use App\Models\Store\Offer;
use App\Models\Store\OfferItem;
use App\Models\Store\OfferPrice;
use App\Models\Catalog\Product;
use App\Models\Catalog\Price;
use App\Models\Theme;
use App\Enums\Store\OfferItemType;
use App\Enums\ChargeType;
use App\Enums\ProductStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OfferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demoOrg = Organization::where('name', 'Demo Organization')->first();
        $adminUser = User::where('email', 'dev@plandalf.com')->first();
        
        if (!$demoOrg || !$adminUser) {
            $this->command->error('Demo organization or admin user not found. Please run OrganizationSeeder first.');
            return;
        }

        $this->command->info('Creating sample offers...');

        // Get the demo org's default theme
        $theme = Theme::where('organization_id', $demoOrg->id)->first();
        if (!$theme) {
            $theme = Theme::create([
                'organization_id' => $demoOrg->id,
                'name' => 'Default theme',
                ...Theme::themeDefaults()
            ]);
        }

        // Create sample products first
        $products = $this->createProducts($demoOrg);
        
        // Create sample offers
        $this->createOffers($demoOrg, $adminUser, $theme, $products);

        $this->command->info('Sample offers created successfully!');
    }

    private function createProducts(Organization $demoOrg): array
    {
        $products = [];

        // Course Product
        $courseProduct = Product::create([
            'organization_id' => $demoOrg->id,
            'name' => 'Ultimate Marketing Course',
            'description' => 'Master digital marketing with our comprehensive course',
            'lookup_key' => 'course-' . Str::random(8),
            'status' => ProductStatus::active,
        ]);

        // Course Pricing
        Price::create([
            'organization_id' => $demoOrg->id,
            'product_id' => $courseProduct->id,
            'name' => 'Standard Price',
            'lookup_key' => 'price-' . Str::random(8),
            'scope' => 'list',
            'type' => 'one_time',
            'currency' => 'USD',
            'amount' => 29700, // $297.00
            'is_active' => true,
        ]);

        $products['course'] = $courseProduct;

        // Coaching Product
        $coachingProduct = Product::create([
            'organization_id' => $demoOrg->id,
            'name' => '1-on-1 Business Coaching',
            'description' => 'Personal coaching sessions with marketing experts',
            'lookup_key' => 'coaching-' . Str::random(8),
            'status' => ProductStatus::active,
        ]);

        // Coaching Pricing
        Price::create([
            'organization_id' => $demoOrg->id,
            'product_id' => $coachingProduct->id,
            'name' => 'Monthly Coaching',
            'lookup_key' => 'price-' . Str::random(8),
            'scope' => 'list',
            'type' => 'one_time',
            'currency' => 'USD',
            'amount' => 59700, // $597.00
            'is_active' => true,
        ]);

        $products['coaching'] = $coachingProduct;

        // Membership Product
        $membershipProduct = Product::create([
            'organization_id' => $demoOrg->id,
            'name' => 'Marketing Mastermind Membership',
            'description' => 'Monthly membership with exclusive content and community',
            'lookup_key' => 'membership-' . Str::random(8),
            // 'status' => ProductStatus::active,
        ]);

        // Membership Pricing
        Price::create([
            'organization_id' => $demoOrg->id,
            'product_id' => $membershipProduct->id,
            'name' => 'Monthly Membership',
            'lookup_key' => 'price-' . Str::random(8),
            'scope' => 'list',
            'type' => 'recurring',
            'currency' => 'USD',
            'amount' => 9700, // $97.00
            'renew_interval' => 'month',
            'recurring_interval_count' => 1,
            'is_active' => true,
        ]);

        $products['membership'] = $membershipProduct;

        // Digital Product
        $digitalProduct = Product::create([
            'organization_id' => $demoOrg->id,
            'name' => 'Marketing Templates Bundle',
            'description' => 'Ready-to-use marketing templates and assets',
            'lookup_key' => 'templates-' . Str::random(8),
            'status' => ProductStatus::active,
        ]);

        // Digital Product Pricing
        Price::create([
            'organization_id' => $demoOrg->id,
            'product_id' => $digitalProduct->id,
            'name' => 'Bundle Price',
            'lookup_key' => 'price-' . Str::random(8),
            'scope' => 'list',
            'type' => 'one_time',
            'currency' => 'USD',
            'amount' => 4700, // $47.00
            'is_active' => true,
        ]);

        $products['digital'] = $digitalProduct;

        return $products;
    }

    private function createOffers(Organization $demoOrg, User $adminUser, Theme $theme, array $products): void
    {
        // Course Offer
        $courseOffer = Offer::updateOrCreate(
            [
                'organization_id' => $demoOrg->id,
                'name' => 'Marketing Course Launch',
            ],
            [
                'description' => 'Learn digital marketing from industry experts',
                'status' => 'published',
            ]
        );

        // Coaching Offer
        $coachingOffer = Offer::updateOrCreate(
            [
                'organization_id' => $demoOrg->id,
                'name' => 'Business Coaching VIP',
            ],
            [
                'description' => 'Transform your business with 1-on-1 coaching',
                'status' => 'published',
            ]
        );

        // Membership Offer
        $membershipOffer = Offer::updateOrCreate(
            [
                'organization_id' => $demoOrg->id,
                'name' => 'Marketing Mastermind',
            ],
            [
                'description' => 'Join our exclusive marketing community',
                'status' => 'published',
            ]
        );

        // Flash Sale Offer
        $flashOffer = Offer::updateOrCreate(
            [
                'organization_id' => $demoOrg->id,
                'name' => 'Flash Sale - 50% Off',
            ],
            [
                'description' => 'Limited time offer - 50% off everything',
                'status' => 'published',
            ]
        );

        // Lead Magnet Offer
        $leadMagnetOffer = Offer::updateOrCreate(
            [
                'organization_id' => $demoOrg->id,
                'name' => 'Free Marketing Checklist',
            ],
            [
                'description' => 'Get our proven marketing checklist - absolutely free',
                'status' => 'published',
            ]
        );
    }
} 