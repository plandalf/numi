<?php

namespace App\Http\Controllers\Api;

use App\Actions\Checkout\CommitCheckoutAction;
use App\Actions\Checkout\CreateCheckoutSessionAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\Checkout\CheckoutSessionResource;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\OfferItem;
use App\Modules\Integrations\Contracts\AcceptsDiscount;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use Stripe\Exception\InvalidRequestException;

class CheckoutSessionController extends Controller
{
    public function __construct(
        private readonly CreateCheckoutSessionAction $createCheckoutSessionAction,
        private readonly CommitCheckoutAction $commitCheckoutAction
    ) {}

    public function storeMutation(CheckoutSession $checkoutSession, Request $request)
    {
        $action = $request->input('action');

        switch ($action) {
            case 'setFields':
                $checkoutSession->update([
                    'metadata' => $request->input('metadata'),
                ]);
                break;
            case 'setProperties':
                return $this->setProperties($checkoutSession, $request);
            case 'commit':
                return $this->commit($checkoutSession, $request);
            case 'setItem':
                return $this->setItem($checkoutSession, $request);
            case 'addDiscount':
                return $this->addDiscount($checkoutSession, $request);
            case 'removeDiscount':
                return $this->removeDiscount($checkoutSession, $request);
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

            $this->commitCheckoutAction->execute($checkoutSession, $token);

            return response()->json([
                'message' => 'Commit successful',
                'checkout_session' => new CheckoutSessionResource($checkoutSession),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function setItem(CheckoutSession $checkoutSession, Request $request)
    {
        $required = $request->input('required');
        $priceId = $request->input('price_id');
        $quantity = $request->input('quantity');

        $args = [];

        if (!$request->has('offer_item_id')) {
            return response()->json([
                'message' => 'Offer item ID is required',
            ], 400);
        }

        if ($request->has('price_id')) {
            $price = Price::where('lookup_key', $priceId)->firstOrFail();
            $args['price_id'] = $price->id;
        } else {
            $offerItem = OfferItem::where('id', $request->input('offer_item_id'))->firstOrFail();
            $args['price_id'] = $offerItem->default_price_id;
        }

        if ($request->has('quantity')) {
            $args['quantity'] = $quantity;
        }

        if ($request->has('required')) {
            if (!$required) {
                $checkoutSession->lineItems()->where('offer_item_id', $request->input('offer_item_id'))->delete();

                $checkoutSession->load(['lineItems.offerItem', 'offer.theme', 'lineItems.price.integration', 'lineItems.price.product']);
                return new CheckoutSessionResource($checkoutSession);
            }
        }

        $checkoutSession->lineItems()->updateOrCreate([
            'offer_item_id' => $request->input('offer_item_id'),
        ], [
            ...$args,
            'organization_id' => $checkoutSession->organization_id,
            'deleted_at' => null,
        ]);

        $checkoutSession->load(['lineItems.offerItem', 'offer.theme', 'lineItems.price.integration', 'lineItems.price.product']);
        return new CheckoutSessionResource($checkoutSession);
    }

    private function setProperties(CheckoutSession $checkoutSession, Request $request)
    {
        $properties = json_decode($request->input('properties'), true);

        $checkoutSession->update([
            'properties' => array_merge($checkoutSession->properties ?? [], $properties),
        ]);

        $checkoutSession->load(['lineItems.offerItem', 'offer.theme', 'lineItems.price.integration', 'lineItems.price.product']);
        return new CheckoutSessionResource($checkoutSession);
    }

    private function addDiscount(CheckoutSession $checkoutSession, Request $request)
    {
        $coupon = $request->input('discount');

        try {

            $integrationClient = $checkoutSession->integrationClient();

            if (! $integrationClient) {
                return response()->json([
                    'message' => 'Integration client not found',
                ], 400);
            }

            if (! $integrationClient instanceof AcceptsDiscount) {
                return response()->json([
                    'message' => 'Integration does not support discounts',
                ], 400);
            }

            $discount = $integrationClient->getDiscount($coupon);

            if(!$discount->valid) {
                return response()->json([
                    'message' => 'Invalid coupon',
                ], 400);
            }

            $existingDiscounts = $checkoutSession->discounts;

            if (in_array($discount['id'], Arr::pluck($existingDiscounts ?? [], 'id'))) {
                return response()->json([
                    'message' => 'Discount already added',
                ], 400);
            }

            $checkoutSession->update([
                'discounts' => array_merge($existingDiscounts ?? [], [$discount]),
            ]);

            $checkoutSession->load(['lineItems.offerItem', 'offer.theme', 'lineItems.price.integration', 'lineItems.price.product']);
            return new CheckoutSessionResource($checkoutSession);
        } catch (InvalidRequestException $e) {
            return response()->json([
                'message' => "No such coupon: '{$coupon}'"
            ], 400);
        }
    }

    public function removeDiscount(CheckoutSession $checkoutSession, Request $request)
    {
        $discount = $request->input('discount');

        $checkoutSession->update([
            'discounts' => Arr::where($checkoutSession->discounts, fn($d) => $d['id'] !== $discount),
        ]);

        $checkoutSession->load(['lineItems.offerItem', 'offer.theme', 'lineItems.price.integration', 'lineItems.price.product']);
        return new CheckoutSessionResource($checkoutSession);
    }
}
