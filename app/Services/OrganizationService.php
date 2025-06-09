<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Str;


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

    public function generateSubdomain(string $name): ?string
    {
        $baseSubdomain = Str::slug($name);
        $subdomain = $baseSubdomain;
        $counter = 1;
        $restrictedSubdomains = config('restricted-subdomains');

        // First check if base subdomain is restricted
        if (in_array($subdomain, $restrictedSubdomains)) {
            $subdomain = $baseSubdomain . '-' . Str::lower(Str::random(4));
        }

        while (
            Organization::where('subdomain', $subdomain)->exists() ||
            in_array($subdomain, $restrictedSubdomains)
        ) {
            // If subdomain exists or is restricted, append a random 4 character string
            $subdomain = $baseSubdomain . '-' . Str::lower(Str::random(4));

            // if we somehow still get collisions, return null to use checkout as default
            if ($counter++ > 10) {
                return null;
            }
        }

        return $subdomain;
    }
}
