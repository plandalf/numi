<?php

namespace App\Http\Controllers;

use App\Enums\OnboardingStep;
use App\Enums\OnboardingInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class OnboardingController extends Controller
{
    /**
     * Get the current onboarding status
     */
    public function index()
    {
        $organization = Auth::user()->currentOrganization;
        
        $steps = collect(OnboardingStep::cases())->map(function ($step) use ($organization) {
            return [
                'key' => $step->key(),
                'label' => $step->label(),
                'description' => $step->description(),
                'completed' => $organization->isOnboardingStepCompleted($step),
                'value' => $step->value,
            ];
        });

        return response()->json([
            'steps' => $steps,
            'completion_percentage' => $organization->getOnboardingCompletionPercentage(),
            'is_complete' => $organization->isOnboardingComplete(),
            'completed_steps' => $organization->getCompletedOnboardingSteps(),
            'incomplete_steps' => $organization->getIncompleteOnboardingSteps(),
        ]);
    }

    /**
     * Update a single onboarding step
     */
    public function updateStep(Request $request, string $stepKey)
    {
        $step = OnboardingStep::fromKey($stepKey);
        
        if (!$step) {
            return response()->json(['error' => 'Invalid onboarding step'], 404);
        }

        $request->validate([
            'completed' => 'required|boolean',
        ]);

        $organization = Auth::user()->currentOrganization;

        if ($request->completed) {
            $organization->markOnboardingStepCompleted($step);
        } else {
            $organization->markOnboardingStepIncomplete($step);
        }

        return response()->json([
            'message' => 'Onboarding step updated successfully',
            'step' => [
                'key' => $step->key(),
                'label' => $step->label(),
                'completed' => $organization->isOnboardingStepCompleted($step),
            ],
            'completion_percentage' => $organization->getOnboardingCompletionPercentage(),
        ]);
    }

    /**
     * Bulk update multiple onboarding steps
     */
    public function bulkUpdate(Request $request)
    {
        $validStepKeys = collect(OnboardingStep::cases())->map(fn($step) => $step->key())->toArray();
        
        $request->validate([
            'steps' => 'required|array',
            'steps.*' => ['required', Rule::in($validStepKeys)],
            'completed' => 'required|boolean',
        ]);

        $organization = Auth::user()->currentOrganization;
        $updatedSteps = [];

        foreach ($request->steps as $stepKey) {
            $step = OnboardingStep::fromKey($stepKey);
            
            if ($step) {
                if ($request->completed) {
                    $organization->markOnboardingStepCompleted($step);
                } else {
                    $organization->markOnboardingStepIncomplete($step);
                }

                $updatedSteps[] = [
                    'key' => $step->key(),
                    'label' => $step->label(),
                    'completed' => $organization->isOnboardingStepCompleted($step),
                ];
            }
        }

        return response()->json([
            'message' => 'Onboarding steps updated successfully',
            'updated_steps' => $updatedSteps,
            'completion_percentage' => $organization->getOnboardingCompletionPercentage(),
            'is_complete' => $organization->isOnboardingComplete(),
        ]);
    }

    /**
     * Mark a step as completed (convenience method)
     */
    public function completeStep(string $stepKey)
    {
        $step = OnboardingStep::fromKey($stepKey);
        
        if (!$step) {
            return response()->json(['error' => 'Invalid onboarding step'], 404);
        }

        $organization = Auth::user()->currentOrganization;
        $organization->markOnboardingStepCompleted($step);

        return response()->json([
            'message' => 'Onboarding step completed successfully',
            'step' => [
                'key' => $step->key(),
                'label' => $step->label(),
                'completed' => true,
            ],
            'completion_percentage' => $organization->getOnboardingCompletionPercentage(),
        ]);
    }

    /**
     * Reset all onboarding steps
     */
    public function reset()
    {
        $organization = Auth::user()->currentOrganization;
        $organization->onboarding_mask = 0;
        $organization->save();

        return response()->json([
            'message' => 'Onboarding progress reset successfully',
            'completion_percentage' => 0,
            'is_complete' => false,
        ]);
    }

    /**
     * Mark an informational onboarding item as seen
     */
    public function markInfoSeen(string $infoKey)
    {
        $info = OnboardingInfo::fromKey($infoKey);
        
        if (!$info) {
            return response()->json(['error' => 'Invalid onboarding info item'], 404);
        }

        $user = Auth::user();
        $user->markOnboardingInfoSeen($info);

        return response()->json([
            'message' => 'Informational onboarding item marked as seen',
            'info' => [
                'key' => $info->key(),
                'label' => $info->label(),
                'seen' => true,
            ],
        ]);
    }

    /**
     * Get informational onboarding status
     */
    public function getInfoStatus()
    {
        $user = Auth::user();
        
        $items = collect(OnboardingInfo::cases())->map(function ($info) use ($user) {
            return [
                'key' => $info->key(),
                'label' => $info->label(),
                'description' => $info->description(),
                'seen' => $user->hasSeenOnboardingInfo($info),
                'value' => $info->value,
            ];
        });

        return response()->json([
            'items' => $items,
            'seen_items' => $user->getSeenOnboardingInfo(),
            'unseen_items' => $user->getUnseenOnboardingInfo(),
        ]);
    }
}
