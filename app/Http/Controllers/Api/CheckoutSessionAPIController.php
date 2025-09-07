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
        $organization = request('api_organization');

        $sessions = CheckoutSession::query()
            ->where('organization_id', $organization->id)
            ->with([
                'lineItems.price',
                'order' => function ($query) {
                    $query->with([
                        'items.price.product.integration',
                        'items.offerItem',
                        'items.fulfilledBy:id,name,email',
                        'customer:id,name,email',
                        'organization:id,name,subdomain'
                    ]);
                },
                'customer:id,name,email',
                'paymentMethod'
            ])
            ->cursorPaginate($request->integer('per_page', 15));

        return CheckoutSessionApiResponse::collection($sessions);
    }

    /**
     * Retrieve a checkout session.
     *
     * @param CheckoutSession $session
     * @return CheckoutSessionApiResponse
     */
    public function show(CheckoutSession $checkout)
    {
        $checkout->loadMissing([
            'lineItems.price',
            'customer',
            'order' => function ($query) {
                $query->with([
                    'items.price.product.integration',
                    'items.offerItem',
                    'items.fulfilledBy:id,name,email',
                    'customer:id,name,email',
                    'organization:id,name,subdomain',
                    'events.user:id,name,email'
                ]);
            },
            'paymentMethod',
            'organization:id,name,subdomain'
        ]);

        return new CheckoutSessionApiResponse($checkout);
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
