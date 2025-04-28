<?php

namespace App\Http\Controllers\Api;

use App\Actions\Checkout\CommitCheckoutAction;
use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Http\Controllers\Controller;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\Offer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CheckoutSessionController extends Controller
{
    public function __construct(
        private readonly CreateCheckoutSessionAction $createCheckoutSessionAction,
        private readonly CommitCheckoutAction $commitCheckoutAction
    ) {}

    public function storeMutation(CheckoutSession $checkoutSession, Request $request)
    {
        // get checkout
        $action = $request->input('action');
        // $submit = new SubmitPageService() -> $submit($checkoutId, $action);
        // props
        //
        switch ($action) {
            case 'setFields':
                $checkoutSession->update([
                    'metadata' => $request->input('metadata'),
                ]);
                break;
            case 'commit':
                return $this->commit($checkoutSession, $request);
            default:
                abort(400);
        }

        return [
            'id' => $checkoutSession->id,
        ];
    }

    private function commit(CheckoutSession $checkoutSession, Request $request): JsonResponse
    {
        try {
            $token = $request->input('confirmation_token');

            if (empty($token)) {
                throw ValidationException::withMessages([
                    'payment_method' => ['Confirmation token is required'],
                ]);
            }

            $checkoutSession->load(['lineItems.price.integration']);
            $this->commitCheckoutAction->execute($checkoutSession, $token);

            return response()->json([
                'message' => 'Commit successful',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
