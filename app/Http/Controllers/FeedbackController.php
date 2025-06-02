<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use App\Notifications\FeedbackSubmittedNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feedback' => ['required', 'string', 'max:2000'],
            'imageUrl' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = Auth::user();
        $organization = $user?->currentOrganization ?? null;

        Notification::route('slack', config('services.slack.notifications.channel'))
            ->notify(new FeedbackSubmittedNotification(
                $validated['feedback'],
                $user,
                $organization,
                $validated['imageUrl'] ?? null
            ));

        return response()->json(['message' => 'Feedback sent successfully.']);
    }
} 