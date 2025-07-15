<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ImpersonationController extends Controller
{
    /**
     * Impersonate a user by their signed URL
     */
    public function impersonate(Request $request)
    {
        // Only allow in local development
        if (!app()->environment('local')) {
            abort(404);
        }

        // Validate the signed URL
        if (!$request->hasValidSignature()) {
            abort(403, 'Invalid or expired impersonation link');
        }

        $userId = $request->get('user_id');
        $user = User::findOrFail($userId);

        // Log in the user
        Auth::login($user);

        // Set current organization if user has one
        if ($user->current_organization_id) {
            session(['current_organization_id' => $user->current_organization_id]);
        }

        return redirect()->route('dashboard')->with('success', "You are now impersonating {$user->name} ({$user->email})");
    }

    /**
     * Generate a signed impersonation URL for a user
     */
    public static function generateImpersonationUrl(User $user, int $expiresInMinutes = 60): string
    {
        return URL::temporarySignedRoute(
            'impersonate',
            now()->addMinutes($expiresInMinutes),
            ['user_id' => $user->id]
        );
    }

    /**
     * Stop impersonating and return to original user (if implemented)
     */
    public function stopImpersonation()
    {
        // Only allow in local development
        if (!app()->environment('local')) {
            abort(404);
        }

        // For now, just logout
        Auth::logout();
        
        return redirect()->route('login')->with('success', 'Impersonation ended');
    }
} 