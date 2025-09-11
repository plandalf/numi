<?php

namespace App\Http\Controllers\Api;

use App\Actions\Checkout\CommitCheckoutAction;
use App\Actions\Checkout\PreparePaymentAction;
use App\Actions\Checkout\PreviewSubscriptionChangeAction;
use App\Enums\CheckoutSessionStatus;
use App\Exceptions\CheckoutException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Checkout\CheckoutSessionResource;
use App\Models\Catalog\Price;
use App\Models\Checkout\CheckoutSession;
use App\Models\Store\OfferItem;
use App\Modules\Integrations\Contracts\AcceptsDiscount;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\InvalidRequestException;
use App\Modules\Integrations\Stripe\Stripe as StripeIntegration;

class CheckoutSessionController extends Controller
{
    public function preview(CheckoutSession $checkoutSession, Request $request)
    {
        $action = app(PreviewSubscriptionChangeAction::class);
        $effectiveAt = $request->input('effective_at');

        $result = $action($checkoutSession, $effectiveAt);

        return response()->json($result);
    }

    public function storeMutation(
        CheckoutSession $checkoutSession,
        Request $request
    ) {
        $action = $request->input('action');

        try {
            switch ($action) {
                case 'setFields':
                    return $checkoutSession->update($request->only('metadata'));
                case 'setProperties':
                    return $this->setProperties($checkoutSession, $request);
                case 'setItem':
                    return $this->setItem($checkoutSession, $request);
                case 'switchVariant':
                    return $this->switchVariant($checkoutSession, $request);
                case 'switchProduct':
                    return $this->switchProduct($checkoutSession, $request);
                case 'addDiscount':
                    return $this->addDiscount($checkoutSession, $request);
                case 'removeDiscount':
                    return $this->removeDiscount($checkoutSession, $request);
                case 'setDefaultPaymentMethod':
                case 'setPaymentMethod':
                    return $this->setDefaultPaymentMethod($checkoutSession, $request);
                case 'commit':
                    return $this->commit($checkoutSession, $request);
                case 'prepare_payment':
                    return $this->preparePayment($checkoutSession, $request);
                default:
                    abort(400);
            }
        } catch (CheckoutException $e) {
            report($e);

            return response()->json([
                'message' => $e->getMessage(),
                'type' => $e->type,
            ], 400);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'message' => $e->getMessage(), // 'An error occurred while processing the request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    protected function setItem(CheckoutSession $checkoutSession, Request $request)
    {
        $required = $request->input('required');
        $priceId = $request->input('price_id');
        $quantity = $request->input('quantity');

        $args = [];

        if (! $request->has('offer_item_id')) {
            return response()->json([
                'message' => 'Offer item ID is required',
            ], 400);
        }

        if ($request->has('price_id')) {
            $price = Price::where('id', $priceId)->firstOrFail();
            $args['price_id'] = $price->id;
        } else {
            $offerItem = OfferItem::where('id', $request->input('offer_item_id'))->firstOrFail();
            $args['price_id'] = $offerItem->default_price_id;
        }

        if ($request->has('quantity')) {
            $args['quantity'] = $quantity;
        }

        if ($request->has('required')) {
            if (! $required) {
                $checkoutSession->lineItems()->where('offer_item_id', $request->input('offer_item_id'))->delete();

                $checkoutSession->load(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

                // Don't include payment methods for setItem mutations - they're not needed
                return new CheckoutSessionResource($checkoutSession);
            }
        }

        // Prefer updating existing row for this offer_item_id; if not present, update a row with NULL offer_item_id
        $targetOfferItemId = (int) $request->input('offer_item_id');
        $existingForOfferItem = $checkoutSession->lineItems()->where('offer_item_id', $targetOfferItemId)->first();
        if (! $existingForOfferItem) {
            $existingForOfferItem = $checkoutSession->lineItems()->whereNull('offer_item_id')->orderBy('id')->first();
        }

        if ($existingForOfferItem) {
            $existingForOfferItem->update(array_merge($args, [
                'offer_item_id' => $targetOfferItemId,
                'organization_id' => $checkoutSession->organization_id,
                'deleted_at' => null,
            ]));
        } else {
            $checkoutSession->lineItems()->updateOrCreate([
                'offer_item_id' => $targetOfferItemId,
            ], [
                ...$args,
                'organization_id' => $checkoutSession->organization_id,
                'deleted_at' => null,
            ]);
        }

        $checkoutSession->load(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

        return new CheckoutSessionResource($checkoutSession);
    }

    protected function switchVariant(CheckoutSession $checkoutSession, Request $request)
    {
        $validated = $request->validate([
            'offer_item_id' => 'required|integer',
            'interval' => 'nullable|in:day,week,month,year',
            'type' => 'nullable|in:recurring,one_time',
            'currency' => 'nullable|string', // ignored; we use session currency
            'product_id' => 'nullable|integer',
        ]);

        // recurring_interval_count?

        $offerItem = OfferItem::query()
            ->where('offer_id', $checkoutSession->offer_id)
            ->findOrFail($validated['offer_item_id']);

        $basePrice = Price::query()->find($offerItem->default_price_id) ?? $offerItem->prices()->first();
        abort_if(! $basePrice, 404, 'Base price not found');

        // Checkouts cannot change currency; always use the session currency
        $targetCurrency = $checkoutSession->currency;

        // Determine the list price id whose children we should search (variants only)
        // If a product_id is provided, resolve that product's list price as the base
        if (! empty($validated['product_id'])) {
            $explicitList = Price::query()
                ->where('product_id', $validated['product_id'])
                ->where('scope', 'list')
                ->where('currency', strtolower($targetCurrency))
                ->orderByDesc('is_active')
                ->orderByDesc('id')
                ->first();

            abort_if(! $explicitList, 404, 'Target product list price not found');
            $listPriceId = $explicitList->id;
        } else {
            $listPriceId = $basePrice->scope === 'list'
                ? $basePrice->id
                : $basePrice->parent_list_price_id;
        }

        abort_if(! $listPriceId, 404, 'Parent list price not found for variant search');

        // Search only VARIANT scoped children under the list price, in the session currency
        $candidates = Price::query()
            ->where('parent_list_price_id', $listPriceId)
            ->where('scope', 'variant')
            ->where('currency', strtolower($targetCurrency))
            ->get();

        $matched = $candidates->first(function (Price $p) use ($validated) {
            $typeOk = isset($validated['type']) ? $p->type->value === $validated['type'] : true;
            $intOk = isset($validated['interval']) ? $p->renew_interval === $validated['interval'] : true;

            return $typeOk && $intOk;
        }) ?? $candidates->first();

        abort_if(! $matched, 404, 'Matching variant not found');

        $checkoutSession->lineItems()->updateOrCreate([
            'offer_item_id' => $offerItem->id,
        ], [
            'price_id' => $matched->id,
            'organization_id' => $checkoutSession->organization_id,
            'deleted_at' => null,
        ]);

        $checkoutSession->load(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

        return new CheckoutSessionResource($checkoutSession);
    }

    /**
     * Switch the product for a line item by setting its price to the target product's list price
     * in the checkout session currency. Does not attempt to choose variants.
     */
    protected function switchProduct(CheckoutSession $checkoutSession, Request $request)
    {
        $validated = $request->validate([
            'offer_item_id' => 'required|integer',
            'product_id' => 'required|integer',
        ]);

        $offerItem = OfferItem::query()
            ->where('offer_id', $checkoutSession->offer_id)
            ->findOrFail($validated['offer_item_id']);

        $targetCurrency = strtolower($checkoutSession->currency);

        // Pick the most recent active list price for the product in the session currency
        $listPrice = Price::query()
            ->where('product_id', $validated['product_id'])
//            ->where('scope', 'list')
            ->where('currency', $targetCurrency)
            ->orderByDesc('id')
            ->first();

        abort_if(! $listPrice, 404, 'Target product list price not found');

        // Prefer updating an existing row for this offer_item_id; if not present, update a row with NULL offer_item_id
        $existingForOfferItem = $checkoutSession->lineItems()->where('offer_item_id', $offerItem->id)->first();
        if (! $existingForOfferItem) {
            $existingForOfferItem = $checkoutSession->lineItems()->whereNull('offer_item_id')->orderBy('id')->first();
        }

        if ($existingForOfferItem) {
            $existingForOfferItem->update([
                'offer_item_id' => $offerItem->id,
                'price_id' => $listPrice->id,
                'organization_id' => $checkoutSession->organization_id,
                'deleted_at' => null,
            ]);
        } else {
            $checkoutSession->lineItems()->updateOrCreate([
                'offer_item_id' => $offerItem->id,
            ], [
                'price_id' => $listPrice->id,
                'organization_id' => $checkoutSession->organization_id,
                'deleted_at' => null,
            ]);
        }

        $checkoutSession->load(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

        return new CheckoutSessionResource($checkoutSession);
    }

    protected function setProperties(CheckoutSession $checkoutSession, Request $request)
    {
        $properties = json_decode($request->input('properties'), true);

        $checkoutSession->update([
            'properties' => array_merge($checkoutSession->properties ?? [], $properties),
        ]);

        $checkoutSession->load(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

        return new CheckoutSessionResource($checkoutSession);
    }

    protected function addDiscount(CheckoutSession $checkoutSession, Request $request)
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

            if (! $discount->valid) {
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

            $checkoutSession->load(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

            // Include payment methods for discount validation
            $request->merge(['include_payment_methods' => true]);

            return new CheckoutSessionResource($checkoutSession);
        } catch (InvalidRequestException $e) {
            return response()->json([
                'message' => "No such coupon: '{$coupon}'",
            ], 400);
        }
    }

    protected function removeDiscount(CheckoutSession $checkoutSession, Request $request)
    {
        $discount = $request->input('discount');

        $checkoutSession->update([
            'discounts' => Arr::where($checkoutSession->discounts, fn ($d) => $d['id'] !== $discount),
        ]);

        $checkoutSession->load(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

        return new CheckoutSessionResource($checkoutSession);
    }

    /**
     * Set a saved payment method as default and prepare an intent using it.
     * Supports both setup/payment modes, same as preparePayment but without Elements.
     */
    protected function setDefaultPaymentMethod(CheckoutSession $session, Request $request)
    {
        $validated = $request->validate([
            'payment_method_id' => 'required|string',
        ]);

        abort_if($session->status === CheckoutSessionStatus::CLOSED, 400, 'Checkout session is not active');
        abort_if($session->hasACompletedOrder(), 400, 'Checkout session is already completed');

        $integrationClient = $session->integrationClient();
        abort_if(! $integrationClient || ! $integrationClient instanceof StripeIntegration, 400, 'Integration client not found');
        abort_if(is_null($session->customer), 400, 'No customer found for this checkout session.');

        // 1) Set default payment method at the provider
        $integrationClient->setDefaultPaymentMethod(
            $session->customer->reference_id,
            $validated['payment_method_id']
        );

        // 2) Prepare an intent JIT (same as preparePayment) so commit can proceed
        $prepare = app(PreparePaymentAction::class, ['session' => $session]);
        $extras = $prepare([
            'email' => $session->customer->email ?? data_get($session->properties, 'email'),
            'current_url' => $request->fullUrl(),
            // No payment_type because we are using an existing saved method
        ]);

        // 3) Attach and confirm the intent with the saved payment method (no Elements)
        try {
            $client = $integrationClient->getStripeClient();
            if ($session->intent_type === 'payment' && $session->intent_id && $session->intent_id !== 'skipped') {
                $pi = $client->paymentIntents->confirm($session->intent_id, [
                    'payment_method' => $validated['payment_method_id'],
                    'return_url' => route('checkout.redirect.callback', [$session]),
                ]);
                $extras['intent_status'] = $pi->status ?? null;
                $extras['next_action'] = $pi->next_action ?? null;
            } elseif ($session->intent_type === 'setup' && $session->intent_id) {
                $si = $client->setupIntents->confirm($session->intent_id, [
                    'payment_method' => $validated['payment_method_id'],
                    'return_url' => route('checkout.redirect.callback', [$session]),
                ]);
                $extras['intent_status'] = $si->status ?? null;
                $extras['next_action'] = $si->next_action ?? null;
            }
        } catch (\Throwable $e) {
            report($e);
            // Surface a friendly error while keeping original flow intact
            return response()->json([
                'message' => 'Failed to confirm payment with the selected method: '.$e->getMessage(),
            ], 400);
        }

        // Reload relationships for updated resource
        $session->refresh();
        $session->loadMissing(['lineItems.offerItem.offerPrices', 'lineItems.price.product', 'lineItems.price']);

        return array_merge([
            'message' => 'Default payment method set and intent prepared',
            'checkout_session' => new CheckoutSessionResource($session),
        ], $extras ?? []);
    }

    // public function set

    /**
     * JIT: Prepare payment by creating the appropriate Stripe intent just-in-time
     * This is called by the frontend after validating payment details
     */
    protected function preparePayment(CheckoutSession $session, Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'payment_type' => 'nullable|string',
            'current_url' => 'required|url',
        ]);

        abort_if($session->status === CheckoutSessionStatus::CLOSED, 400, 'Checkout session is not active');

        abort_if($session->hasACompletedOrder(), 400, 'Checkout session is already completed');

        abort_if(! is_null($session->payment_confirmed_at), 400, 'Payment is already confirmed');

        $prepare = app(PreparePaymentAction::class, ['session' => $session]);

        $extras = $prepare($validated);

        return array_merge([
            'message' => 'Payment prepared',
            'checkout_session' => new CheckoutSessionResource($session),
        ], $extras);
    }

    /**
     * Commit will attempt to finalize the checkout session and process the order.
     */
    protected function commit(CheckoutSession $session, Request $request)
    {
        abort_if($session->hasACompletedOrder(), 400, 'Checkout session is already completed');

        abort_if(
            $session->intent_type !== 'free' && (! $session->intent_id || ! $session->client_secret),
            400,
            'No payment intent found. Payment must be prepared first.'
        );

        abort_if(is_null($session->customer), 400, 'No customer found for this checkout session.');

        $commit = app(CommitCheckoutAction::class);

        $result = $commit($session);

        // Handle different return types
        if (is_array($result)) {
            // Subscription change result
            return [
                'message' => $result['message'],
                'signal' => $result['signal'],
                'result' => $result['result'],
                'checkout_session' => new CheckoutSessionResource($result['checkout_session']),
            ];
        } else {
            // Order result
            $session->refresh();
            $session->loadMissing(['order', 'order.items']);

            return [
                'message' => 'Order processed successfully',
                'checkout_session' => new CheckoutSessionResource($session),
            ];
        }
    }
}
