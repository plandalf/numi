<?php

namespace App\Policies;

use App\Models\Automation\Sequence;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SequencePolicy
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
    public function view(User $user, Sequence $sequence): bool
    {
        return $user->currentOrganization && 
               $user->currentOrganization->id === $sequence->organization_id;
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
    public function update(User $user, Sequence $sequence): bool
    {
        return $user->currentOrganization && 
               $user->currentOrganization->id === $sequence->organization_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Sequence $sequence): bool
    {
        return $user->currentOrganization && 
               $user->currentOrganization->id === $sequence->organization_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Sequence $sequence): bool
    {
        return $user->currentOrganization && 
               $user->currentOrganization->id === $sequence->organization_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Sequence $sequence): bool
    {
        return $user->currentOrganization && 
               $user->currentOrganization->id === $sequence->organization_id;
    }
}
