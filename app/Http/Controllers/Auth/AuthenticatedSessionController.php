<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Organization;
use App\Services\OrganizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    protected $organizationService;

    public function __construct(OrganizationService $organizationService)
    {
        $this->organizationService = $organizationService;
    }

    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        $organization = $this->organizationService->getOrganizationByJoinToken(
            Session::get('join_token')
        );
        
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'organization' => $organization,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();

        $organization = $this->organizationService->getOrganizationByJoinToken(
            Session::get('join_token')
        );

        if ($organization) {

            // If the user is already a member of the organization, redirect back with an error
            if ($user->organizations->contains($organization->id)) {
                return redirect()->back()->with('error', 'You are already a member of this organization.');
            }

            // Join the organization
            $this->organizationService->attachUserToOrganization($user, $organization);
            
            // Clear the join token from the session
            Session::forget('join_token');
            
            return redirect()
                ->route('dashboard')
                ->with('success', 'Successfully joined organization.');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
