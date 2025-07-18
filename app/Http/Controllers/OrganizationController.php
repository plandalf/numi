<?php

namespace App\Http\Controllers;

use App\Enums\OnboardingStep;
use App\Http\Resources\OrganizationResource;
use App\Mail\OrderNotificationEmail;
use App\Models\Customer;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\Organization;
use App\Models\Theme;
use App\Models\User;
use App\Services\OrganizationService;
use App\Http\Requests\Organization\StoreOrganizationRequest;
use App\Http\Requests\Organization\UpdateOrganizationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    protected $organizationService;

    public function __construct(OrganizationService $organizationService)
    {
        $this->organizationService = $organizationService;
    }

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
    public function store(StoreOrganizationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $organization = Organization::create([
            ...$validated,
            'subdomain' => $this->organizationService->generateSubdomain($validated['name']),
            'trial_ends_at' => now()->addDays(
                (int) config('cashier.trial_days')
            ),
        ]);

        $organization->themes()->create([
            'name' => 'Default theme',
            ...Theme::themeDefaults()
        ]);

        $organization->users()->attach($request->user());
        $request->user()->switchOrganization($organization);

        // Mark profile setup as completed since they've created an organization with settings
        $organization->markOnboardingStepCompleted(OnboardingStep::PROFILE_SETUP);

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
    public function update(UpdateOrganizationRequest $request, Organization $organization): RedirectResponse
    {
        $validated = $request->validated();

        $organization->update($validated);

        // Mark profile setup as completed since they've updated their organization settings
        if (!$organization->isOnboardingStepCompleted(OnboardingStep::PROFILE_SETUP)) {
            $organization->markOnboardingStepCompleted(OnboardingStep::PROFILE_SETUP);
        }

        return redirect()->back()->with('success', 'Organization updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Organization $organization)
    {
        //
    }

    /**
     * Display the join page for an organization.
     */
    public function joinPage(Request $request, string $joinToken): Response
    {
        $organization = $this->organizationService->getOrganizationByJoinToken($joinToken);

        // Store the join token in the session for later use
        Session::put('join_token', $joinToken);

        return Inertia::render('auth/join', [
            'organization' => $organization,
            'user' => $request->user(),
        ]);
    }

    /**
     * Join an organization using the join token.
     */
    public function join(Request $request): RedirectResponse
    {
        $joinToken = $request->input('join_token') ?? Session::get('join_token');

        if (! $joinToken) {
            return redirect()->route('home')->with('error', 'Invalid join link.');
        }

        $user = $request->user();

        // If the user is not logged in, redirect to the register page
        if (! $user) {
            return redirect()->route('register');
        }

        $organization = $this->organizationService->getOrganizationByJoinToken($joinToken);

        if ($organization) {

            // If the user is already a member of the organization, redirect back with an error
            if ($user->organizations->contains($organization->id)) {
                return redirect()->back()->with('error', 'You are already a member of this organization.');
            }

            // Join the organization
            $this->organizationService->attachUserToOrganization($user, $organization);

            // Clear the join token from the session
            Session::forget('join_token');

            return redirect()->route('dashboard')->with('success', 'Successfully joined organization.');
        }

        return redirect()->route('home')->with('error', 'Invalid join link.');
    }

    public function switch(Organization $organization): RedirectResponse
    {
        $user = request()->user();

        if (! $user->organizations->contains($organization->id)) {
            return redirect()->back()->with('error', 'You do not have access to this organization.');
        }

        $user->switchOrganization($organization);

        return redirect()->route('dashboard');
    }

    public function settings(): Response
    {
        $organization = request()->user()->currentOrganization;

        return Inertia::render('organizations/settings/general', [
            'organization' => new OrganizationResource($organization),
        ]);
    }

    public function team(): Response
    {
        $organization = request()->user()->currentOrganization;
        $organization->load('users');

        return Inertia::render('organizations/settings/team', [
            'organization' => new OrganizationResource($organization),
        ]);
    }

    /**
     * Remove a user from the organization.
     */
    public function removeTeamMember(Request $request, Organization $organization, User $user): RedirectResponse
    {
        // Prevent removing the current user
        if ($request->user()->id === $user->id) {
            return redirect()->back()->with('error', 'You cannot remove yourself from the organization.');
        }

        // Check if the user is a member of the organization
        if (! $organization->users()->where('user_id', $user->id)->exists()) {
            return redirect()->back()->with('error', 'User is not a member of this organization.');
        }

        // Remove the user from the organization
        $organization->users()->detach($user->id);

        // Switch the main org of the user to the first available organization if it is the current user's main organization
        if ($organization->id === $user->current_organization_id) {

            $user->switchToAvailableOrganization();
        }

        return redirect()->back()->with('success', 'Team member removed successfully.');
    }

    /**
     * Display the SEO settings page.
     */
    public function seoSettings(): Response
    {
        $organization = request()->user()->currentOrganization;
        $organization->load(['logoMedia', 'faviconMedia']);

        return Inertia::render('organizations/settings/seo', [
            'organization' => new OrganizationResource($organization),
        ]);
    }

    /**
     * Update the SEO settings.
     */
    public function updateSeoSettings(Request $request, Organization $organization): RedirectResponse
    {
        $validated = $request->validate([
            'description' => 'nullable|string|max:1000',
            'website_url' => 'nullable|url|max:255',
            'logo_media_id' => 'nullable|integer|exists:medias,id',
            'favicon_media_id' => 'nullable|integer|exists:medias,id',
            'primary_color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            'social_media' => 'nullable|array',
            'social_media.facebook' => 'nullable|url|max:255',
            'social_media.twitter' => 'nullable|url|max:255',
            'social_media.instagram' => 'nullable|url|max:255',
            'social_media.linkedin' => 'nullable|url|max:255',
        ]);

        $organization->update($validated);

        return redirect()->back()->with('success', 'SEO & Branding settings updated successfully.');
    }

    /**
     * Show the fulfillment settings page.
     */
    public function fulfillment(): Response
    {
        $organization = request()->user()->currentOrganization;

        return Inertia::render('organizations/settings/fulfillment', [
            'organization' => new OrganizationResource($organization),
        ]);
    }

    /**
     * Update the fulfillment settings.
     */
    public function updateFulfillment(Request $request): RedirectResponse
    {
        $organization = request()->user()->currentOrganization;

        $validated = $request->validate([
            'fulfillment_method' => 'required|in:automation,api,manual,external_webhook,hybrid',
            'default_delivery_method' => 'required|in:physical_shipping,digital_download,email_delivery,api_provisioning,manual_provision,virtual_delivery,instant_access,external_platform',
            'fulfillment_notification_email' => 'nullable|email',
            'auto_fulfill_orders' => 'boolean',
            'fulfillment_config' => 'nullable|array',
            'external_platform_config' => 'nullable|array',
        ]);

        $organization->update($validated);

        return redirect()->back()->with('success', 'Fulfillment settings updated successfully.');
    }

    /**
     * Send a test fulfillment notification email.
     */
    public function sendTestFulfillmentEmail(Request $request): RedirectResponse
    {
        $organization = request()->user()->currentOrganization;

        // Log the request data for debugging
        \Log::info('Test email request data', [
            'all_data' => $request->all(),
            'email' => $request->input('email'),
            'fulfillment_notification_email' => $request->input('fulfillment_notification_email'),
        ]);

        // Try to get email from either the 'email' field or 'fulfillment_notification_email' field
        $email = $request->input('email') ?? $request->input('fulfillment_notification_email');
        
        if (!$email) {
            return redirect()->back()->with('error', 'Email address is required for test emails.');
        }

        $validated = ['email' => $email];
        
        // Validate the email format
        $request->validate([
            'email' => 'email',
        ], [
            'email' => 'Please provide a valid email address.',
        ]);

        try {
            // Try to find the latest order from this organization, or create a test order
            $testOrder = $this->getTestOrder($organization);
            
            // Send the test email
            Mail::to($validated['email'])->send(new OrderNotificationEmail($testOrder, true));

            return redirect()->back()->with('success', 'Test fulfillment email sent successfully to ' . $validated['email']);
        } catch (\Exception $e) {
            \Log::error('Test email error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()->with('error', 'Failed to send test email: ' . $e->getMessage());
        }
    }

    /**
     * Get a test order for fulfillment email testing.
     */
    private function getTestOrder(Organization $organization): Order
    {
        // First, try to find the latest order from this organization
        $latestOrder = Order::where('organization_id', $organization->id)
            ->with(['items.price', 'items.offerItem', 'customer'])
            ->latest()
            ->first();

        if ($latestOrder) {
            // Use the latest order but mark it as a test
            return $latestOrder;
        }

        // If no orders exist, throw an exception with a helpful message
        throw new \Exception('No orders found in this organization. Please create at least one order to test fulfillment emails.');
    }
}
