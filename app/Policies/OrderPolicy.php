<?php

namespace App\Policies;

use App\Models\Order\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrderPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Users can view their organization's orders
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Order $order): bool
    {
        return $this->belongsToUserOrganization($user, $order);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Users can create orders for their organization
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Order $order): bool
    {
        return $this->belongsToUserOrganization($user, $order);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Order $order): bool
    {
        return $this->belongsToUserOrganization($user, $order);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Order $order): bool
    {
        return $this->belongsToUserOrganization($user, $order);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Order $order): bool
    {
        return $this->belongsToUserOrganization($user, $order);
    }

    /**
     * Determine whether the user can fulfill the order.
     */
    public function fulfill(User $user, Order $order): bool
    {
        return $this->belongsToUserOrganization($user, $order);
    }

    /**
     * Determine whether the user can access fulfillment for the order.
     */
    public function fulfillment(User $user, Order $order): bool
    {
        return $this->belongsToUserOrganization($user, $order);
    }

    /**
     * Check if the order belongs to the user's current organization.
     */
    private function belongsToUserOrganization(User $user, Order $order): bool
    {
        return $order->organization_id === $user->currentOrganization->id;
    }
}
