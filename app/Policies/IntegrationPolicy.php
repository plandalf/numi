<?php

namespace App\Policies;

use App\Models\Integration;
use App\Models\User;

class IntegrationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->currentOrganization !== null;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Integration $integration): bool
    {
        return $user->currentOrganization 
            && $integration->organization_id === $user->current_organization_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->currentOrganization !== null;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Integration $integration): bool
    {
        return $user->currentOrganization 
            && $integration->organization_id === $user->current_organization_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Integration $integration): bool
    {
        return $user->currentOrganization 
            && $integration->organization_id === $user->current_organization_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Integration $integration): bool
    {
        return $user->currentOrganization 
            && $integration->organization_id === $user->current_organization_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Integration $integration): bool
    {
        return $user->currentOrganization 
            && $integration->organization_id === $user->current_organization_id;
    }
} 