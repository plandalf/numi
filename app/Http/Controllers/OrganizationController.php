<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Requests\UpdateOrganizationRequest;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        /* @var Organization $organization */
        $organization = Organization::query()
            ->create($validated);

        $organization->users()->attach($request->user());
        $request->user()->switchOrganization($organization);

        return redirect()->route('dashboard');
    }

    /**
     * Display the specified resource.
     */
    public function show(Organization $organization)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Organization $organization)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOrganizationRequest $request, Organization $organization)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Organization $organization)
    {
        //
    }

    public function join(string $ulid): RedirectResponse
    {
        $organization = Organization::where('ulid', $ulid)->firstOrFail();
        $user = request()->user();

        if ($user->organizations->contains($organization->id)) {
            return redirect()->back()->with('error', 'You are already a member of this organization.');
        }

        $organization->users()->attach($user);
        $user->switchOrganization($organization);

        return redirect()->back()->with('success', 'Successfully joined organization.');
    }

    public function switch(Organization $organization): RedirectResponse
    {
        $user = request()->user();

        if (!$user->organizations->contains($organization->id)) {
            return redirect()->back()->with('error', 'You do not have access to this organization.');
        }

        $user->switchOrganization($organization);

        return redirect()->back();
    }
}
