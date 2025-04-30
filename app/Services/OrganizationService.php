<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Organization;
use App\Models\User;

class OrganizationService
{
    /**
     * Create a new offer from a template.
     *
     * @param  string  $joinToken
     */
    public function getOrganizationByJoinToken($joinToken): ?Organization
    {
        $organization = null;

        if ($joinToken) {
            $organization = Organization::where('join_token', $joinToken)->first();
        }

        return $organization;
    }

    /**
     * Attach a user to an organization.
     */
    public function attachUserToOrganization(User $user, Organization $organization): void
    {
        $organization->users()->attach($user, ['role' => Role::MEMBER]);
        $user->switchOrganization($organization);
    }
}
