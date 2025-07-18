<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\CheckoutSessionApiResponse;
use App\Models\Checkout\CheckoutSession;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Pagination\CursorPaginator;

#[Group('Checkout Sessions')]
class CheckoutSessionAPIController
{
    /**
     * List all checkout sessions.
     *
     * @param Request $request
     * @return CursorPaginator<CheckoutSessionApiResponse>
     */
    public function index(Request $request)
    {
        $sessions = CheckoutSession::query()
            ->cursorPaginate($request->integer('per_page', 15));

        return CheckoutSessionApiResponse::collection($sessions);
    }

    /**
     * Retrieve a checkout session.
     *
     * @param CheckoutSession $session
     * @return CheckoutSessionApiResponse
     */
    public function show(CheckoutSession $session)
    {
        $session->loadMissing([
            'lineItems'
        ]);

        return new CheckoutSessionApiResponse($session);
    }

    /**
     * Create a checkout session.
     * @param Request $request
     * @return void
     */
    public function store(Request$request)
    {
        $request->validate([
            /**
             * The location coordinates.
             * @var array{lat: float, long: float}
             */
            'coordinates' => 'array',
        ]);

        return new CheckoutSessionApiResponse();
    }
}
