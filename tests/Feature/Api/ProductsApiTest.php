<?php

declare(strict_types=1);

use App\Models\Catalog\Product;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns searchable product list scoped to current organization', function () {
    $orgA = Organization::factory()->create();
    $orgB = Organization::factory()->create();

    $user = User::factory()->create([
        'current_organization_id' => $orgA->id,
    ]);
    $user->organizations()->attach($orgA->id);

    // Products in org A
    Product::factory()->create(['organization_id' => $orgA->id, 'name' => 'Alpha Product']);
    Product::factory()->create(['organization_id' => $orgA->id, 'name' => 'Beta Widget']);
    Product::factory()->create(['organization_id' => $orgA->id, 'name' => 'Gamma Tool']);

    // Product in another org
    Product::factory()->create(['organization_id' => $orgB->id, 'name' => 'Zeta Product']);

    $this->actingAs($user);
        ->getJson('/api/products?search=Product')
        ->assertOk()
        ->assertJson(fn ($json) => $json
            ->each(fn ($item) => $item->whereAllType([
                'id' => 'integer',
                'name' => 'string',
            ]))
        )
        ->assertJsonMissing(['name' => 'Zeta Product']);
});


