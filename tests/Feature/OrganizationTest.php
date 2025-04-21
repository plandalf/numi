<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Enums\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;
    private User $owner;
    private User $member;

    protected function setUp(): void
    {
        parent::setUp();

        // Create an organization with an owner
        $this->owner = User::factory()->create();
        $this->organization = Organization::factory()->create();
        $this->organization->users()->attach($this->owner, ['role' => Role::MEMBER->value]);
        $this->owner->switchOrganization($this->organization);

        // Create a member
        $this->member = User::factory()->create();
        $this->organization->users()->attach($this->member, ['role' => Role::MEMBER->value]);
        $this->member->switchOrganization($this->organization);
    }

    #[Test]
    public function owner_can_remove_team_member()
    {
        $this->actingAs($this->owner)
            ->delete(route('organizations.settings.team.remove', [
                'organization' => $this->organization->id,
                'user' => $this->member->id,
            ]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $this->member->id,
        ]);
    }

    #[Test]
    public function member_can_remove_other_team_members()
    {
        $organization = Organization::factory()->create();
        $otherMember = User::factory()->create([
            'current_organization_id' => $organization->id,
        ]);
        $this->organization->users()->attach($otherMember, ['role' => Role::MEMBER->value]);

        $this->actingAs($this->member)
            ->delete(route('organizations.settings.team.remove', [
                'organization' => $this->organization->id,
                'user' => $otherMember->id,
            ]))
            ->assertFound();

        $this->assertDatabaseMissing('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $otherMember->id,
        ]);
    }

    #[Test]
    public function user_cannot_remove_themselves_from_organization()
    {
        $this->actingAs($this->member)
            ->delete(route('organizations.settings.team.remove', [
                'organization' => $this->organization->id,
                'user' => $this->member->id,
            ]))
            ->assertRedirect()
            ->assertSessionHas('error', 'You cannot remove yourself from the organization.');

        $this->assertDatabaseHas('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $this->member->id,
        ]);
    }

    #[Test]
    public function guest_can_view_join_page()
    {
        $response = $this->get(route('auth.join', $this->organization->join_token));

        $response->assertStatus(200)
            ->assertInertia(fn ($assert) => $assert
                ->component('auth/join')
                ->has('organization')
                ->where('organization.id', $this->organization->id)
                ->where('organization.name', $this->organization->name)
            );
    }

    #[Test]
    public function authenticated_user_can_join_via_join_page()
    {
        $organization = Organization::factory()->create();
        $newUser = User::factory()->create([
            'current_organization_id' => $organization->id,
        ]);

        $response = $this->actingAs($newUser)
            ->post(route('organizations.join'), [
                'join_token' => $this->organization->join_token,
            ]);

        $response->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $newUser->id,
            'role' => Role::MEMBER->value,
        ]);
    }

    #[Test]
    public function guest_is_redirected_to_register_when_joining()
    {
        $response = $this->post(route('organizations.join'), [
            'join_token' => $this->organization->join_token,
        ]);

        $response->assertRedirect(route('register'));
    }

    #[Test]
    public function user_can_join_after_registration()
    {
        // Store join token in session
        session(['join_token' => $this->organization->join_token]);

        // Create a new user through registration
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];

        $response = $this->post(route('register'), $userData);

        $newUser = User::where('email', 'test@example.com')->first();
        
        $this->assertDatabaseHas('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $newUser->id,
            'role' => Role::MEMBER->value,
        ]);

        $response->assertRedirect(route('dashboard'));
    }

    #[Test]
    public function user_can_join_after_login()
    {
        // Store join token in session
        session(['join_token' => $this->organization->join_token]);

        $newUser = User::factory()->create([
            'password' => bcrypt('password'),
        ]);

        $response = $this->post(route('login'), [
            'email' => $newUser->email,
            'password' => 'password',
        ]);

        $this->assertDatabaseHas('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $newUser->id,
            'role' => Role::MEMBER->value,
        ]);

        $response->assertRedirect(route('dashboard'));
    }

    #[Test]
    public function cannot_join_with_invalid_token()
    {
        $organization = Organization::factory()->create();
        $newUser = User::factory()->create([
            'current_organization_id' => $organization->id,
        ]);

        $response = $this->actingAs($newUser)
            ->post(route('organizations.join'), [
                'join_token' => 'invalid-token',
            ]);

        $response->assertRedirect(route('home'))
            ->assertSessionHas('error', 'Invalid join link.');

        $this->assertDatabaseMissing('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $newUser->id,
        ]);
    }

    #[Test]
    public function user_cannot_join_organization_twice()
    {
        $response = $this->actingAs($this->member)
            ->post(route('organizations.join'), [
                'join_token' => $this->organization->join_token,
            ]);

        $response->assertRedirect()
            ->assertSessionHas('error', 'You are already a member of this organization.');

        $this->assertDatabaseCount('organization_users', 2); // Only owner and original member
    }

    #[Test]
    public function user_current_organization_is_switched_when_removed_from_current_org()
    {
        // Create another organization for the member to be part of
        $otherOrganization = Organization::factory()->create();
        $this->member->organizations()->attach($otherOrganization, ['role' => Role::MEMBER->value]);
        
        // Verify member's current organization is the one we're about to remove them from
        $this->assertEquals($this->organization->id, $this->member->current_organization_id);

        $this->actingAs($this->owner)
            ->delete(route('organizations.settings.team.remove', [
                'organization' => $this->organization->id,
                'user' => $this->member->id,
            ]))
            ->assertRedirect()
            ->assertSessionHas('success');

        // Refresh the member model to get updated data
        $this->member->refresh();

        // Assert that the member's current organization has been switched to the other organization
        $this->assertEquals($otherOrganization->id, $this->member->current_organization_id);
        
        // Verify they were removed from the original organization
        $this->assertDatabaseMissing('organization_users', [
            'organization_id' => $this->organization->id,
            'user_id' => $this->member->id,
        ]);
    }
} 