<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use App\Services\OrganizationService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    protected $organizationService;

    public function __construct(OrganizationService $organizationService)
    {
        $this->organizationService = $organizationService;
    }

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        $organization = $this->organizationService->getOrganizationByJoinToken(
            Session::get('join_token')
        );

        return Inertia::render('auth/register', [
            'organization' => $organization,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

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
                ->with('success', 'Account created and joined organization successfully.');
        }

        return redirect()->route('dashboard');
    }
}
