<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence channel for offer editing
Broadcast::channel('offer.{offerId}.editing', function ($user, $offerId) {
    // Verify the user has access to this offer through their organization
    $offer = \App\Models\Store\Offer::retrieve($offerId);

    if (!$offer || $offer->organization_id !== $user->current_organization_id) {
        return false;
    }

    $hash = md5($user->email);

    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar' => "https://www.gravatar.com/avatar/${hash}?s=200&d=identicon",
    ];
});
