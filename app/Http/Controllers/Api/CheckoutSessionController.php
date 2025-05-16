<?php

namespace App\Http\Controllers\Api;

use App\Actions\Checkout\CommitCheckoutAction;
use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Http\Controllers\Controller;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\OfferItem;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
            case 'setItem':
                /** @todo Create Request validation class for this */
                $required = $request->input('required');
                $priceId = $request->input('price_id');
                $quantity = $request->input('quantity');

                $args = [];

                if(!$request->has('offer_item_id')) {
                    return response()->json([
                        'message' => 'Offer item ID is required',
                    ], 400);
                }

                if($request->has('price_id')) {
                    $price = Price::where('lookup_key', $priceId)->firstOrFail();
                    $args['price_id'] = $price->id;
                } else {
                    $offerItem = OfferItem::where('id', $request->input('offer_item_id'))->firstOrFail();
                    $args['price_id'] = $offerItem->default_price_id;
                }

                if($request->has('quantity')) {
                    $args['quantity'] = $quantity;
                }

                if($request->has('required')) {
                    if(!$required) {
                        $checkoutSession->lineItems()->where('offer_item_id', $request->input('offer_item_id'))->delete();

                        return redirect()->back()->with('success', 'Item removed from checkout');
                    }
                }

                $checkoutSession->lineItems()->updateOrCreate([
                    'offer_item_id' => $request->input('offer_item_id'),
                ], [
                    ...$args,
                    'organization_id' => $checkoutSession->organization_id,
                    'deleted_at' => null,
                ]);


                return redirect()->back()->with('success', 'Item added to checkout');
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
